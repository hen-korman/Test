# Deployment Guide - Baby Congratulations Make.com Workflow

## 🚀 Step-by-Step Deployment

### Phase 1: HiBob API Setup

1. **Get HiBob API Access**
   ```
   1. Log into your HiBob admin account
   2. Navigate to Settings > Integrations > API
   3. Generate a new API token
   4. Note the token and base URL
   5. Test API access with a simple GET request
   ```

2. **Verify Required Permissions**
   ```
   Required scopes:
   - people:read (to verify employee exists)
   - people:write (to update employee records)
   - dependents:write (to add family members)
   ```

### Phase 2: Make.com Scenario Creation

1. **Create New Scenario**
   ```
   1. Log into Make.com
   2. Click "Create a new scenario"
   3. Name it "Baby Congratulations Workflow"
   ```

2. **Add Module 1: HR Trigger Webhook**
   ```
   Module: Webhooks > Custom Webhook
   Name: "HR Baby Notification Trigger"
   
   Setup:
   - Click "Add" to create webhook
   - Copy the webhook URL (save for HR team)
   - Set data structure to expect:
     {
       "employeeId": "string",
       "employeeName": "string", 
       "employeeEmail": "string",
       "hrRepresentative": "string"
     }
   ```

3. **Add Module 2: Send Congratulations Email**
   ```
   Module: Email > Send an Email
   
   Configuration:
   - To: {{1.employeeEmail}}
   - Subject: "🎉 Congratulations on Your New Baby!"
   - Body: Use the HTML template from makecom_scenario_setup.md
   - Replace [YOUR_FORM_URL] with your hosted form URL
   ```

4. **Add Module 3: Form Submission Webhook**
   ```
   Module: Webhooks > Custom Webhook
   Name: "Baby Form Submission"
   
   Setup:
   - Click "Add" to create second webhook
   - Copy this webhook URL (for form configuration)
   - Set to receive form data structure
   ```

5. **Add Module 4: Data Transformation**
   ```
   Module: Tools > Set Variables
   
   Variables:
   - birthDate = {{formatDate(3.babyBirthDate; "YYYY-MM-DD")}}
   - babyFirstName = {{split(3.babyName; " "; 1)}}
   - babyLastName = {{join(slice(split(3.babyName; " "); 2); " ")}}
   ```

6. **Add Module 5: HiBob - Add Dependent**
   ```
   Module: HiBob > Make an API Call
   
   Connection Setup:
   - Click "Add" next to Connection
   - Enter Connection Name: "HiBob Production"
   - Enter API Key: [Your HiBob API Token]
   - Save connection
   
   API Call Configuration:
   - URL: /v1/people/{{3.employeeId}}/dependents
   - Method: POST
   - Headers:
     Content-Type: application/json
     Authorization: Bearer {{connection.apiKey}}
   - Body:
     {
       "firstName": "{{4.babyFirstName}}",
       "lastName": "{{4.babyLastName}}",
       "relationship": "child",
       "dateOfBirth": "{{4.birthDate}}",
       "gender": "{{3.babyGender}}"
     }
   ```

7. **Add Module 6: HiBob - Update Employee Notes**
   ```
   Module: HiBob > Make an API Call
   
   Configuration:
   - URL: /v1/people/{{3.employeeId}}
   - Method: PATCH
   - Body:
     {
       "work": {
         "customFields": {
           "lastFamilyEvent": "New baby: {{3.babyName}} born {{3.babyBirthDate}}",
           "parentalLeaveRequested": "{{3.requestMaternityPaternity}}",
           "benefitsInfoRequested": "{{3.requestBenefitsInfo}}"
         }
       }
     }
   ```

8. **Add Module 7: HR Notification Email**
   ```
   Module: Email > Send an Email
   
   Configuration:
   - To: hr@company.com (or {{1.hrRepresentative}}@company.com)
   - Subject: "New Baby Form Completed - {{3.employeeName}}"
   - Body: Use template from makecom_scenario_setup.md
   ```

### Phase 3: Form Deployment

1. **Prepare Form File**
   ```bash
   # Copy the form file to your web server
   cp baby_congratulations_form.html /var/www/html/baby-form.html
   
   # Or upload to your hosting provider
   ```

2. **Update Form Configuration**
   ```javascript
   // In baby_congratulations_form.html, update line ~200:
   const WEBHOOK_URL = 'YOUR_FORM_SUBMISSION_WEBHOOK_URL_FROM_STEP_2_4';
   ```

3. **Test Form Accessibility**
   ```bash
   # Verify form is accessible
   curl -I https://yourcompany.com/baby-form.html
   
   # Should return: HTTP/1.1 200 OK
   ```

### Phase 4: HR Integration

1. **Create HR Documentation**
   ```markdown
   # HR: How to Trigger Baby Congratulations Workflow
   
   When an employee reports a new baby:
   
   1. Use this webhook URL: [HR_TRIGGER_WEBHOOK_FROM_STEP_2_2]
   2. Send POST request with employee data:
   
   curl -X POST "HR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{
       "employeeId": "EMP123",
       "employeeName": "John Doe",
       "employeeEmail": "john.doe@company.com", 
       "hrRepresentative": "Jane Smith"
     }'
   
   3. Employee will receive congratulations email automatically
   4. You'll get notification when they complete the form
   ```

2. **Create HR Dashboard/Tool (Optional)**
   ```html
   <!-- Simple HTML form for HR to trigger workflow -->
   <!DOCTYPE html>
   <html>
   <head><title>HR Baby Notification Tool</title></head>
   <body>
     <h2>New Baby Notification</h2>
     <form id="hrForm">
       <input type="text" name="employeeId" placeholder="Employee ID" required>
       <input type="text" name="employeeName" placeholder="Employee Name" required>
       <input type="email" name="employeeEmail" placeholder="Employee Email" required>
       <input type="text" name="hrRepresentative" placeholder="Your Name" required>
       <button type="submit">Send Congratulations</button>
     </form>
     
     <script>
       document.getElementById('hrForm').onsubmit = async function(e) {
         e.preventDefault();
         const formData = new FormData(e.target);
         const data = Object.fromEntries(formData);
         
         try {
           await fetch('HR_WEBHOOK_URL', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify(data)
           });
           alert('Congratulations email sent!');
           e.target.reset();
         } catch (error) {
           alert('Error: ' + error.message);
         }
       };
     </script>
   </body>
   </html>
   ```

### Phase 5: Testing and Validation

1. **Test HR Trigger**
   ```bash
   # Test with sample data
   curl -X POST "YOUR_HR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{
       "employeeId": "TEST123",
       "employeeName": "Test Employee",
       "employeeEmail": "test@company.com",
       "hrRepresentative": "HR Tester"
     }'
   ```

2. **Verify Email Delivery**
   ```
   ✅ Check test employee receives congratulations email
   ✅ Verify form link works in email
   ✅ Confirm email formatting is correct
   ```

3. **Test Form Submission**
   ```
   ✅ Fill out form completely
   ✅ Submit form and verify success message
   ✅ Check Make.com execution logs
   ✅ Verify data appears in HiBob
   ✅ Confirm HR receives notification
   ```

4. **Test Error Scenarios**
   ```
   ✅ Invalid employee ID
   ✅ Missing required form fields
   ✅ Future birth date
   ✅ Invalid email addresses
   ✅ HiBob API unavailable
   ```

### Phase 6: Production Deployment

1. **Update Email Template**
   ```
   - Replace [Company Name] with actual company name
   - Add company logo/branding
   - Include HR contact information
   - Add legal disclaimers if required
   ```

2. **Configure Monitoring**
   ```
   Make.com:
   - Set up execution monitoring
   - Configure error notifications
   - Set up usage alerts
   
   Form:
   - Add analytics tracking
   - Monitor submission success rate
   - Set up uptime monitoring
   ```

3. **Security Review**
   ```
   ✅ Form uses HTTPS
   ✅ API tokens stored securely
   ✅ Input validation in place
   ✅ Rate limiting configured
   ✅ Access logs enabled
   ```

## 🔄 Rollback Plan

If issues occur during deployment:

1. **Disable Make.com Scenario**
   ```
   1. Go to Make.com scenario
   2. Click "Turn off" 
   3. All triggers stop immediately
   ```

2. **Revert Form**
   ```bash
   # Remove or rename form file
   mv baby-form.html baby-form.html.backup
   
   # Replace with maintenance page
   echo "Form temporarily unavailable" > baby-form.html
   ```

3. **Manual Process Fallback**
   ```
   HR can:
   1. Send congratulations email manually
   2. Create shared Google Form as temporary solution
   3. Manually enter baby data into HiBob
   ```

## 📋 Post-Deployment Checklist

- [ ] All webhooks tested and working
- [ ] Form hosted and accessible
- [ ] HiBob integration verified
- [ ] HR team trained on process
- [ ] Documentation distributed
- [ ] Monitoring configured
- [ ] Error handling tested
- [ ] Backup procedures documented
- [ ] Success metrics defined
- [ ] Regular review scheduled

## 🔧 Configuration Reference

### Environment Variables (if using webhook handler)
```bash
MAKE_COM_WEBHOOK_URL=https://hook.integromat.com/your-webhook-id
HIBOB_API_TOKEN=your-hibob-api-token
HIBOB_API_BASE_URL=https://api.hibob.com/v1
HR_EMAIL=hr@company.com
NODE_ENV=production
PORT=3000
```

### Make.com Module Settings
```
Scenario Settings:
- Max execution time: 10 minutes
- Max cycles: 1
- Error handling: Continue on error
- Logging: Full logs enabled

Email Module:
- Provider: Gmail/Outlook/SendGrid
- From name: Company HR Team
- From email: noreply@company.com

HiBob Module:
- Timeout: 30 seconds
- Retry: 3 attempts
- Error handling: Stop on error
```

## 🆘 Emergency Contacts

- **Make.com Support**: support@make.com
- **HiBob Support**: support@hibob.com  
- **IT Team**: it@company.com
- **HR System Admin**: hradmin@company.com

---

**Remember**: Always test in a staging environment before deploying to production!