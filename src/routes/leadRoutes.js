const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Import routes
router.post('/import', upload.single('file'), leadController.importLeads);
router.get('/', leadController.getAllLeads);
router.get('/metrics', leadController.getMetrics);
router.get('/campaign/:campaignId', leadController.getLeadsByCampaign);
router.get('/:leadNumber', leadController.getLead);
router.put('/:leadNumber', leadController.updateLead);

// Send to step endpoints
router.post('/send-to-verification', leadController.sendToVerification);

// Run verification workflow via PreCrafter (LEAD_INPUT → ANYMAILFINDER → LEAD_OUTPUT)
router.post('/run-verification', async (req, res) => {
  console.log('[run-verification] DEBUG: Endpoint called');
  console.log('[run-verification] DEBUG: Request body:', JSON.stringify(req.body).substring(0, 200));
  
  try {
    const { leadNumbers, limit = 100 } = req.body;
    
    console.log('[run-verification] DEBUG: leadNumbers:', leadNumbers);
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      console.log('[run-verification] DEBUG: Invalid leadNumbers');
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const LeadModel = require('../models/LeadModel');
    const WorkflowModel = require('../models/WorkflowModel');
    
    console.log('[run-verification] DEBUG: Fetching leads from database...');
    
    // Get leads from database
    const leads = await Promise.all(
      leadNumbers.map(async (leadNumber) => {
        const lead = await LeadModel.findByLeadNumber(leadNumber);
        return lead;
      })
    );

    const validLeads = leads.filter(Boolean);
    
    console.log(`[run-verification] DEBUG: Found ${validLeads.length} valid leads out of ${leadNumbers.length} requested`);
    
    if (validLeads.length === 0) {
      return res.status(404).json({ error: 'No valid leads found' });
    }

    console.log(`[run-verification] Processing ${validLeads.length} leads...`);

    // Get the precrafter workflow to extract the flow
    console.log('[run-verification] DEBUG: Fetching precrafter workflow...');
    const workflow = await WorkflowModel.getLatestWorkflow('precrafter');
    
    console.log('[run-verification] DEBUG: Workflow fetched:', workflow ? 'found' : 'not found');
    console.log('[run-verification] DEBUG: Workflow nodes:', workflow?.nodes?.length || 0);
    
    if (!workflow || !workflow.nodes) {
      return res.status(404).json({ error: 'Precrafter workflow not found' });
    }

    // Find the relevant nodes in the workflow
    const leadInputNode = workflow.nodes.find(n => 
      n.data?.type === 'LEAD_INPUT' || n.type === 'LEAD_INPUT'
    );
    const anymailfinderNode = workflow.nodes.find(n => 
      n.data?.type === 'ANYMAILFINDER' || n.type === 'ANYMAILFINDER'
    );
    const leadOutputNode = workflow.nodes.find(n => 
      n.data?.type === 'LEAD_OUTPUT' || n.type === 'LEAD_OUTPUT'
    );

    if (!anymailfinderNode) {
      return res.status(400).json({ error: 'ANYMAILFINDER node not found in workflow' });
    }

    // Step 1: Prepare leads data (simulating LEAD_INPUT output)
    const leadsData = {
      leads: validLeads.map(l => ({
        LeadNumber: l.lead_number,
        email: l.email,
        firstName: l.first_name,
        lastName: l.last_name,
        companyName: l.company_name,
        step_status: l.step_status
      })),
      leadCount: validLeads.length
    };

    console.log(`[run-verification] Step 1: Prepared ${leadsData.leadCount} leads for verification`);

    // Step 2: Run ANYMAILFINDER for each lead
    console.log('[run-verification] DEBUG: Step 2 - Starting ANYMAILFINDER verification...');
    const apiKey = anymailfinderNode.data?.apiKey || process.env.ANYMAILFINDER_API_KEY;
    
    if (!apiKey) {
      console.log('[run-verification] DEBUG: No API key found!');
      return res.status(400).json({ error: 'AnymailFinder API key is required. Configure it in the ANYMAILFINDER_API_KEY environment variable or in the workflow node.' });
    }

    console.log('[run-verification] DEBUG: API key found, starting verification for', validLeads.length, 'leads');
    const verificationResults = [];
    let processed = 0;
    
    for (const lead of validLeads) {
      const email = lead.email;
      if (!email) {
        verificationResults.push({
          leadNumber: lead.lead_number,
          email: email,
          verification_result: { status: 'no_email', error: 'No email address' }
        });
        processed++;
        continue;
      }

      try {
        console.log(`[run-verification] DEBUG: Verifying ${processed + 1}/${validLeads.length}: ${email}`);
        console.log(`[run-verification] DEBUG: Using API key: ${apiKey.substring(0, 10)}...`);
        
        const requestBody = JSON.stringify({ email });
        console.log(`[run-verification] DEBUG: Request body: ${requestBody}`);
        
        const response = await fetch('https://api.anymailfinder.com/v5.1/verify-email', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: requestBody
        });

        const responseText = await response.text();
        console.log(`[run-verification] DEBUG: Response status: ${response.status}`);
        console.log(`[run-verification] DEBUG: Response headers:`, Object.fromEntries(response.headers.entries()));
        console.log(`[run-verification] DEBUG: Response body (first 500 chars): ${responseText.substring(0, 500)}`);
        
        const data = JSON.parse(responseText);
        
        // AnymailFinder v5.1 returns: {"input": {...}, "email_status": "valid"}
        const emailStatus = data.email_status || data.result?.status || 'unknown';
        const isValid = emailStatus === 'valid';
        
        verificationResults.push({
          leadNumber: lead.lead_number,  // Fixed: use lead_number (lowercase)
          email: email,
          verification_result: {
            status: emailStatus,
            is_valid: isValid,
            is_disposable: data.is_disposable || false,
            is_role: data.is_role || false,
            is_catchall: data.is_catchall || false,
            confidence: data.confidence || 0
          }
        });
        
        console.log(`[run-verification] Result for ${email}: ${emailStatus} (valid: ${isValid})`);
        processed++;
      } catch (err) {
        console.error(`[run-verification] Error verifying ${email}:`, err.message);
        verificationResults.push({
          leadNumber: lead.lead_number,
          email: email,
          verification_result: { status: 'error', error: err.message }
        });
        processed++;
      }
    }
    
    console.log('[run-verification] DEBUG: Step 2 complete - Processed', processed, 'leads');

    console.log(`[run-verification] Step 2: Verified ${verificationResults.length} emails`);

    // Step 3: Save results to database (simulating LEAD_OUTPUT)
    const updateResults = [];
    
    for (const result of verificationResults) {
      const leadNumber = result.leadNumber;  // Fixed: use leadNumber (camelCase)
      
      // Get existing step_status or create default
      let stepStatus = validLeads.find(l => l.lead_number === leadNumber)?.step_status || {
        export: true,
        verification: 'pending',
        compScrap: 'pending',
        box1: 'pending',
        instantly: 'pending'
      };

      // Update step_status based on verification result (always do this)
      if (result.verification_result.status === 'valid') {
        stepStatus.verification = 'verified';
        stepStatus.compScrap = 'pending';  // Ready for CompScrap step
        console.log(`[run-verification] Lead ${leadNumber}: verification=verified (ready for CompScrap)`);
      } else if (result.verification_result.status === 'invalid') {
        stepStatus.verification = 'failed';
        stepStatus.compScrap = 'pending';
        console.log(`[run-verification] Lead ${leadNumber}: verification=failed`);
      } else {
        stepStatus.verification = 'error';
        stepStatus.compScrap = 'pending';
        console.log(`[run-verification] Lead ${leadNumber}: verification=error`);
      }

      try {
        await LeadModel.update(leadNumber, {
          verification_result: result.verification_result,
          step_status: stepStatus
        });
        updateResults.push(leadNumber);
      } catch (err) {
        console.error(`[run-verification] Error updating ${leadNumber}:`, err.message);
      }
    }

    console.log(`[run-verification] Step 3: Updated ${updateResults.length} leads in database`);

    // Calculate summary
    const validCount = verificationResults.filter(r => r.verification_result?.status === 'valid').length;
    const invalidCount = verificationResults.filter(r => r.verification_result?.status === 'invalid').length;
    const errorCount = verificationResults.filter(r => r.verification_result?.status === 'error').length;
    const noEmailCount = verificationResults.filter(r => r.verification_result?.status === 'no_email').length;

    res.json({
      success: true,
      message: `Verification workflow completed for ${validLeads.length} leads`,
      count: validLeads.length,
      results: {
        valid: validCount,
        invalid: invalidCount,
        errors: errorCount,
        noEmail: noEmailCount
      },
      leadsUpdated: updateResults.length,
      readyForCompScrap: validCount  // Leads that passed verification and are ready for next step
    });
  } catch (error) {
    console.error('Error running verification:', error);
    res.status(500).json({ error: 'Failed to run verification workflow: ' + error.message });
  }
});
router.post('/send-to-compscrape', leadController.sendToCompScrap);
router.post('/send-to-box1', leadController.sendToBox1);
router.post('/send-to-instantly', leadController.sendToInstantly);
router.post('/send-to-instantly-stock', leadController.sendToInstantlyStock);
router.post('/send-from-stock-to-instantly', leadController.sendFromStockToInstantly);

// Import output endpoints
router.post('/import-verification', upload.single('file'), leadController.importVerificationOutput);
router.post('/import-compscrape', upload.single('file'), leadController.importCompScrapOutput);

// Import compScrap output with custom column mappings
router.post('/import-compscrap-custom', upload.single('file'), leadController.importCompScrapCustom);

// Import compScrap/Box1 output with field mappings (used by CompScrapImportModal)
router.post('/import-compscrape-mapped', upload.single('file'), leadController.importCompscrapeMapped);

// Run Box1 workflow via PreCrafter
router.post('/run-box1', async (req, res) => {
  try {
    const { leadNumbers } = req.body;
    
    if (!leadNumbers || !Array.isArray(leadNumbers) || leadNumbers.length === 0) {
      return res.status(400).json({ error: 'leadNumbers array is required' });
    }

    const LeadModel = require('../models/LeadModel');
    const WorkflowModel = require('../models/WorkflowModel');
    
    // Get leads from database with all fields needed for Box1
    const leads = await Promise.all(
      leadNumbers.map(async (leadNumber) => {
        const lead = await LeadModel.findByLeadNumber(leadNumber);
        return lead;
      })
    );

    const validLeads = leads.filter(Boolean);
    
    if (validLeads.length === 0) {
      return res.status(404).json({ error: 'No valid leads found' });
    }

    console.log(`[run-box1] Processing ${validLeads.length} leads...`);

    // Get the precrafter workflow to extract the flow
    const workflow = await WorkflowModel.getLatestWorkflow('precrafter');
    
    if (!workflow || !workflow.nodes) {
      return res.status(404).json({ error: 'Precrafter workflow not found' });
    }

    // Transform leads to Box1 input format with all required fields
    const box1LeadsData = validLeads.map(lead => ({
      LeadNumber: lead.lead_number,
      TargetID: lead.target_id,
      firstName: lead.first_name,
      lastName: lead.last_name,
      personTitle: lead.person_title,
      personTitleDescription: lead.person_title_description || '',
      personSummary: lead.person_summary || '',
      personLocation: lead.person_location || '',
      durationInRole: lead.duration_in_role || '',
      durationInCompany: lead.duration_in_company || '',
      personTimestamp: lead.person_timestamp || '',
      personLinkedinUrl: lead.person_linkedin_url || '',
      personSalesUrl: lead.person_sales_url || '',
      email: lead.email,
      email_validation: lead.email_validation || '',
      companyName: lead.company_name || '',
      companyDescription: lead.company_description || '',
      companyTagLine: lead.company_tag_line || '',
      industry: lead.industry || '',
      employeeCount: lead.employee_count || '',
      companyLocation: lead.company_location || '',
      website: lead.website || '',
      domain: lead.domain || '',
      yearFounded: lead.year_founded || '',
      specialties: lead.specialties || '',
      phone: lead.phone || '',
      minRevenue: lead.min_revenue || '',
      maxRevenue: lead.max_revenue || '',
      growth6Mth: lead.growth_6mth || '',
      growth1Yr: lead.growth_1yr || '',
      growth2Yr: lead.growth_2yr || '',
      companyTimestamp: lead.company_timestamp_sn || lead.company_timestamp_ln || '',
      linkedInCompanyUrl: lead.linkedin_company_url || '',
      salesNavigatorCompanyUrl: lead.sales_navigator_company_url || ''
    }));

    console.log(`[run-box1] Prepared ${box1LeadsData.length} leads with full data for Box1 workflow`);

    // Find BOX1_INPUT node and pass leads data through context
    const box1InputNode = workflow.nodes.find(n => 
      n.data?.type === 'BOX1_INPUT' || n.type === 'BOX1_INPUT'
    );

    // Build initial context with BOX1_INPUT node data
    let context = {};
    if (box1InputNode) {
      // Create initial context with BOX1_INPUT node containing the leads data
      context[box1InputNode.id] = {
        input: {},
        output: JSON.stringify({
          leads: box1LeadsData,
          leadCount: box1LeadsData.length
        })
      };
      console.log(`[run-box1] Initialized context with BOX1_INPUT node: ${box1InputNode.id}`);
    }

    // Execute workflow nodes (excluding BOX1_INPUT which we already seeded)
    const workflowResults = [];
    for (const node of workflow.nodes) {
      // Skip BOX1_INPUT node (already seeded in context)
      if (node.data?.type === 'BOX1_INPUT' || node.type === 'BOX1_INPUT') {
        continue;
      }
      
      // Skip LEAD_INPUT and LEAD_OUTPUT nodes (not needed for Box1 flow)
      if (node.data?.type === 'LEAD_INPUT' || node.type === 'LEAD_INPUT') {
        continue;
      }
      if (node.data?.type === 'LEAD_OUTPUT' || node.type === 'LEAD_OUTPUT') {
        continue;
      }
      if (node.data?.type === 'ANYMAILFINDER' || node.type === 'ANYMAILFINDER') {
        continue;
      }

      console.log(`[run-box1] Executing node: ${node.id} (${node.data?.type || node.type})`);

      try {
        // Execute node via workflow controller
        const nodeResponse = await fetch('https://backendaos-production.up.railway.app/api/workflows/run-node', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            node: node,
            context: context
          })
        });

        const nodeResult = await nodeResponse.json();
        
        if (nodeResult.success) {
          // Add node result to context for next nodes to use
          context[node.id] = {
            input: node,
            output: nodeResult.output
          };
          workflowResults.push({
            nodeId: node.id,
            type: node.data?.type || node.type,
            status: 'success'
          });
          console.log(`[run-box1] Node ${node.id} executed successfully`);
        } else {
          workflowResults.push({
            nodeId: node.id,
            type: node.data?.type || node.type,
            status: 'error',
            error: nodeResult.error
          });
          console.error(`[run-box1] Node ${node.id} failed:`, nodeResult.error);
        }
      } catch (err) {
        console.error(`[run-box1] Error executing node ${node.id}:`, err.message);
        workflowResults.push({
          nodeId: node.id,
          type: node.data?.type || node.type,
          status: 'error',
          error: err.message
        });
      }
    }

    // Mark leads as sent to box1
    for (const lead of validLeads) {
      await LeadModel.update(lead.lead_number, {
        step_status: {
          ...lead.step_status,
          box1: 'sent'
        },
        box1_sent_at: new Date().toISOString()
      });
    }

    console.log(`[run-box1] Marked ${validLeads.length} leads as sent to Box1`);
    console.log(`[run-box1] Workflow execution completed: ${workflowResults.filter(r => r.status === 'success').length}/${workflowResults.length} nodes successful`);

    res.json({
      success: true,
      message: `${validLeads.length} leads sent to Box1 workflow`,
      count: validLeads.length,
      leadNumbers: validLeads.map(l => l.lead_number),
      data: box1LeadsData,
      workflowResults: workflowResults
    });
  } catch (error) {
    console.error('Error running Box1 workflow:', error);
    res.status(500).json({ error: 'Failed to run Box1 workflow: ' + error.message });
  }
});
router.post('/import-box1', upload.single('file'), leadController.importBox1Output);

// Get input for each step
router.get('/input/verification', leadController.getVerificationInput);
router.get('/input/compscrape', leadController.getCompScrapInput);
router.get('/input/box1', leadController.getBox1Input);
router.get('/input/instantly', leadController.getInstantlyInput);

// Export leads
router.get('/export', leadController.exportLeads);

module.exports = router;
