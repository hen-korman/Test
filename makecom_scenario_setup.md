# Make.com Scenario: New Baby HR Workflow

## Overview
This Make.com scenario automates the process when an employee has a new baby. HR triggers the flow, which sends a congratulatory form to the employee, and upon submission, uploads the data to HiBob via API.

## Scenario Flow

### 1. HR Trigger Module
**Module Type:** Webhooks > Custom Webhook
- **Purpose:** HR initiates the process by sending employee information
- **Setup:**
  1. Create a new webhook in Make.com
  2. Name it "HR New Baby Trigger"
  3. Copy the webhook URL for HR to use
  4. Expected data format:
  ```json
  {
    "employeeId": "EMP123",
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com",
    "hrRepresentative": "Jane Smith",
    "triggerDate": "2025-09-29T10:00:00Z"
  }
  ```

### 2. Email Module - Send Congratulations with Form Link
**Module Type:** Email > Send an Email
- **Purpose:** Send congratulatory email with form link to employee
- **Configuration:**
  - **To:** `{{1.employeeEmail}}` (from HR trigger)
  - **Subject:** "🎉 Congratulations on Your New Baby!"
  - **Body Template:**
  ```html
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); 
                   padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
          .button { display: inline-block; background: #667eea; color: white; 
                   padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                   font-weight: bold; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; 
                   font-size: 14px; color: #666; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>🎉 Congratulations, {{1.employeeName}}!</h1>
              <p>We're thrilled to hear about your new bundle of joy!</p>
          </div>
          
          <p>Dear {{1.employeeName}},</p>
          
          <p>On behalf of everyone at [Company Name], we want to extend our warmest congratulations on the arrival of your new baby! This is such an exciting time for you and your family.</p>
          
          <p>To ensure we can provide you with all the benefits and support available, please take a few minutes to share some details about your little one by completing the form below:</p>
          
          <div style="text-align: center;">
              <a href="[YOUR_FORM_URL]" class="button">Complete Baby Information Form</a>
          </div>
          
          <p>This form will help us:</p>
          <ul>
              <li>Update your employee records</li>
              <li>Provide information about parental leave benefits</li>
              <li>Assist with dependent benefits enrollment</li>
              <li>Ensure you receive all available family support resources</li>
          </ul>
          
          <p>If you have any questions or need assistance, please don't hesitate to reach out to HR.</p>
          
          <p>Once again, congratulations on this wonderful milestone!</p>
          
          <p>Best wishes,<br>
          The HR Team</p>
          
          <div class="footer">
              <p>This is an automated message from your HR system. If you received this in error, please contact HR immediately.</p>
          </div>
      </div>
  </body>
  </html>
  ```

### 3. Webhook Listener for Form Submission
**Module Type:** Webhooks > Custom Webhook
- **Purpose:** Receive form submission data
- **Setup:**
  1. Create another webhook for form submissions
  2. Name it "Baby Form Submission"
  3. Update the form HTML with this webhook URL
  4. Expected data format from form:
  ```json
  {
    "employeeId": "EMP123",
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com",
    "babyName": "Emma Doe",
    "babyGender": "female",
    "babyBirthDate": "2025-09-25",
    "babyWeight": "7 lbs 5 oz",
    "babyLength": "20 inches",
    "relationship": "father",
    "requestMaternityPaternity": "yes",
    "requestBenefitsInfo": "yes",
    "additionalNotes": "Excited to be a dad!",
    "submissionTime": "2025-09-29T14:30:00Z",
    "formType": "baby_congratulations"
  }
  ```

### 4. Data Transformation Module
**Module Type:** Tools > Set Variables
- **Purpose:** Transform and prepare data for HiBob API
- **Variables to Set:**
  ```javascript
  // Format birth date for HiBob
  birthDate = {{formatDate(3.babyBirthDate; "YYYY-MM-DD")}}
  
  // Create family member object for HiBob
  familyMemberData = {
    "firstName": "{{3.babyName.split(' ')[0]}}",
    "lastName": "{{3.babyName.split(' ')[1] || ''}}",
    "relationship": "{{3.relationship === 'mother' || 3.relationship === 'father' ? 'child' : 'dependent'}}",
    "dateOfBirth": "{{birthDate}}",
    "gender": "{{3.babyGender}}",
    "addedDate": "{{formatDate(now; "YYYY-MM-DD")}}"
  }
  
  // Prepare notification data
  notificationData = {
    "employeeId": "{{3.employeeId}}",
    "eventType": "new_baby",
    "eventDate": "{{birthDate}}",
    "requestsParentalLeaveInfo": "{{3.requestMaternityPaternity === 'yes'}}",
    "requestsBenefitsInfo": "{{3.requestBenefitsInfo === 'yes'}}",
    "notes": "{{3.additionalNotes}}"
  }
  ```

### 5. HiBob API - Add Family Member
**Module Type:** HiBob > Make an API Call
- **Purpose:** Add the new baby to employee's family members in HiBob
- **Configuration:**
  - **Connection:** HiBob API (requires API token)
  - **URL:** `/v1/people/{{3.employeeId}}/dependents`
  - **Method:** POST
  - **Headers:**
    ```json
    {
      "Content-Type": "application/json",
      "Authorization": "Bearer {{connection.apiKey}}"
    }
    ```
  - **Body:**
    ```json
    {
      "firstName": "{{4.familyMemberData.firstName}}",
      "lastName": "{{4.familyMemberData.lastName}}",
      "relationship": "{{4.familyMemberData.relationship}}",
      "dateOfBirth": "{{4.familyMemberData.dateOfBirth}}",
      "gender": "{{4.familyMemberData.gender}}"
    }
    ```

### 6. HiBob API - Update Employee Notes
**Module Type:** HiBob > Make an API Call (Optional)
- **Purpose:** Add notes about the new baby event to employee record
- **Configuration:**
  - **URL:** `/v1/people/{{3.employeeId}}`
  - **Method:** PATCH
  - **Body:**
    ```json
    {
      "work": {
        "customFields": {
          "lastFamilyEvent": "New baby: {{3.babyName}} born {{3.babyBirthDate}}",
          "parentalLeaveRequested": "{{3.requestMaternityPaternity === 'yes' ? 'Yes' : 'No'}}",
          "benefitsInfoRequested": "{{3.requestBenefitsInfo === 'yes' ? 'Yes' : 'No'}}"
        }
      }
    }
    ```

### 7. Notification to HR
**Module Type:** Email > Send an Email
- **Purpose:** Notify HR that form was completed and data uploaded
- **Configuration:**
  - **To:** HR email address or `{{1.hrRepresentative}}@company.com`
  - **Subject:** "New Baby Form Completed - {{3.employeeName}}"
  - **Body:**
    ```
    HR Notification: New Baby Form Completed
    
    Employee: {{3.employeeName}} ({{3.employeeId}})
    Baby Name: {{3.babyName}}
    Birth Date: {{3.babyBirthDate}}
    Relationship: {{3.relationship}}
    
    Requests:
    - Parental Leave Info: {{3.requestMaternityPaternity}}
    - Benefits Info: {{3.requestBenefitsInfo}}
    
    Additional Notes: {{3.additionalNotes}}
    
    Data has been successfully uploaded to HiBob.
    Form submitted at: {{3.submissionTime}}
    
    Please follow up with the employee regarding any requested information.
    ```

## Setup Instructions

### 1. Prerequisites
- Make.com account with sufficient operations
- HiBob account with API access
- Web hosting for the HTML form
- Email service integrated with Make.com (Gmail, Outlook, etc.)

### 2. HiBob API Setup
1. Log in to your HiBob account
2. Go to Profile Icon > API access
3. Generate an API token
4. Note the token for Make.com connection setup

### 3. Make.com Scenario Creation
1. Create a new scenario in Make.com
2. Add modules in the order specified above
3. Configure each module with the provided settings
4. Test each module individually
5. Run end-to-end tests

### 4. Form Deployment
1. Host the `baby_congratulations_form.html` file on your web server
2. Update the `WEBHOOK_URL` variable in the form's JavaScript
3. Update the form URL in the email template
4. Test form submission

### 5. HR Training
1. Provide HR with the webhook URL for triggering the flow
2. Train HR on the expected data format
3. Create documentation for common scenarios

## Testing Checklist

- [ ] HR can successfully trigger the scenario
- [ ] Employee receives congratulatory email with correct form link
- [ ] Form displays correctly and is user-friendly
- [ ] Form submission sends data to Make.com webhook
- [ ] Data is properly transformed for HiBob API
- [ ] Family member is successfully added to HiBob
- [ ] Employee notes are updated in HiBob (if configured)
- [ ] HR receives completion notification
- [ ] Error handling works for failed API calls

## Error Handling

### Common Issues and Solutions

1. **Form submission fails:**
   - Check webhook URL is correct
   - Verify CORS settings if hosting form on different domain
   - Check Make.com scenario is active

2. **HiBob API errors:**
   - Verify API token is valid and has correct permissions
   - Check employee ID exists in HiBob
   - Ensure required fields are provided

3. **Email delivery issues:**
   - Verify email addresses are correct
   - Check spam folders
   - Ensure email service connection is active

## Security Considerations

1. **API Token Security:**
   - Store HiBob API token securely in Make.com
   - Regularly rotate API tokens
   - Limit API token permissions to minimum required

2. **Data Privacy:**
   - Ensure form uses HTTPS
   - Implement proper data retention policies
   - Add privacy notice to form

3. **Access Control:**
   - Limit HR access to trigger webhook
   - Validate employee data before processing
   - Log all API transactions for audit

## Maintenance

1. **Regular Tasks:**
   - Monitor scenario execution logs
   - Check API rate limits
   - Update form styling/content as needed
   - Review and update employee data fields

2. **Periodic Reviews:**
   - Review HiBob API for new features
   - Update error handling procedures
   - Optimize scenario performance
   - Update HR training materials