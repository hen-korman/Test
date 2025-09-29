# Baby Congratulations Make.com Workflow

This project implements a complete Make.com scenario that automates the process when an employee has a new baby. HR triggers the flow, which sends a congratulatory form to the employee, and upon submission, uploads the data to HiBob via API.

## 🎯 Overview

The workflow consists of:
1. **HR Trigger**: HR initiates the process for a new parent
2. **Congratulations Email**: Automated email with form link sent to employee
3. **Beautiful Form**: Employee fills out baby details in a user-friendly form
4. **Data Processing**: Form submission triggers Make.com scenario
5. **HiBob Integration**: Baby information is automatically added to HiBob
6. **HR Notification**: HR receives confirmation and next steps

## 📁 Project Structure

```
├── baby_congratulations_form.html    # Beautiful HTML form for employees
├── makecom_scenario_setup.md         # Complete Make.com scenario documentation
├── webhook_handler.js                # Optional webhook handler (backup/testing)
├── test_webhook.js                   # Test script for webhook handler
├── package.json                      # Node.js dependencies
└── README.md                         # This file
```

## 🚀 Quick Start

### 1. Set Up Make.com Scenario

1. Follow the detailed instructions in `makecom_scenario_setup.md`
2. Create the webhook triggers and configure all modules
3. Set up HiBob API connection with your API token
4. Test the scenario end-to-end

### 2. Deploy the Form

1. Host `baby_congratulations_form.html` on your web server
2. Update the webhook URL in the form's JavaScript:
   ```javascript
   const WEBHOOK_URL = 'YOUR_MAKE_COM_WEBHOOK_URL_HERE';
   ```
3. Update the form URL in your Make.com email template

### 3. Configure HR Access

Provide HR with the webhook URL to trigger new baby notifications:
```bash
curl -X POST "YOUR_MAKE_COM_HR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP123",
    "employeeName": "John Doe", 
    "employeeEmail": "john.doe@company.com",
    "hrRepresentative": "Jane Smith"
  }'
```

## 🔧 Optional: Local Webhook Handler

For testing or as a backup, you can run the Node.js webhook handler:

### Prerequisites
- Node.js 14+ installed
- HiBob API token
- Make.com webhook URL

### Installation
```bash
npm install
```

### Configuration
Set environment variables:
```bash
export MAKE_COM_WEBHOOK_URL="your_makecom_webhook_url"
export HIBOB_API_TOKEN="your_hibob_api_token"
export HR_EMAIL="hr@company.com"
```

### Running
```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev

# Run tests (in another terminal)
npm test
```

## 🎨 Form Features

The congratulations form includes:
- **Beautiful Design**: Modern, mobile-responsive UI with gradient backgrounds
- **Congratulatory Message**: Warm, professional congratulations
- **Comprehensive Fields**: All necessary baby and employee information
- **Smart Validation**: Client-side validation with helpful error messages
- **Loading States**: Professional loading indicators during submission
- **Success Feedback**: Clear confirmation when form is submitted
- **Accessibility**: Proper labels, focus states, and keyboard navigation

### Form Fields
- Employee ID, Name, Email
- Baby's full name, gender, birth date
- Optional: Birth weight and length
- Relationship to baby (mother, father, adoptive parent, etc.)
- Benefit preferences (parental leave info, dependent benefits)
- Additional notes

## 🔗 HiBob Integration

The workflow integrates with HiBob to:
- Add the new baby as a dependent to the employee record
- Update employee notes with birth information
- Track benefit requests and family events
- Maintain accurate family member records

### Required HiBob Permissions
Your API token needs access to:
- `people:read` - Read employee information
- `people:write` - Update employee records
- `dependents:write` - Add family members

## 📧 Email Templates

The system sends two types of emails:

### 1. Congratulations Email (to Employee)
- Beautiful HTML design with company branding
- Personal congratulations message
- Clear call-to-action with form link
- Information about available benefits

### 2. HR Notification Email
- Summary of submitted information
- Employee and baby details
- Benefit requests and preferences
- Next steps for HR follow-up

## 🧪 Testing

### Manual Testing Checklist
- [ ] HR can trigger the workflow successfully
- [ ] Employee receives congratulations email
- [ ] Form displays correctly on desktop and mobile
- [ ] Form validation works properly
- [ ] Form submission creates webhook call
- [ ] Data appears correctly in HiBob
- [ ] HR receives notification email
- [ ] Error handling works for edge cases

### Automated Testing
```bash
# Run the test suite
npm test

# Tests cover:
# - Webhook endpoint health
# - HR trigger functionality  
# - Form submission processing
# - Invalid data handling
# - API integration
```

## 🔒 Security Considerations

1. **API Security**
   - Store HiBob API tokens securely
   - Use HTTPS for all form submissions
   - Validate all input data
   - Implement rate limiting if needed

2. **Data Privacy**
   - Include privacy notice on form
   - Secure data transmission
   - Proper data retention policies
   - GDPR compliance considerations

3. **Access Control**
   - Limit HR access to trigger webhooks
   - Validate employee IDs before processing
   - Log all transactions for audit

## 🐛 Troubleshooting

### Common Issues

**Form submission fails:**
- Check webhook URL is correct in form
- Verify Make.com scenario is active and running
- Check browser console for JavaScript errors

**HiBob API errors:**
- Verify API token has correct permissions
- Check employee ID exists in HiBob system
- Ensure required fields are provided

**Email delivery issues:**
- Check email addresses are valid
- Verify email service connection in Make.com
- Check spam/junk folders

**Make.com scenario errors:**
- Check scenario execution logs
- Verify all modules are properly configured
- Test each module individually

## 📈 Monitoring and Maintenance

### Regular Tasks
- Monitor Make.com scenario execution logs
- Check form submission success rates
- Review HiBob API usage and limits
- Update form styling/content as needed

### Periodic Reviews
- Review and update employee data fields
- Check for new HiBob API features
- Update error handling procedures
- Review security settings and permissions

## 🤝 Contributing

To improve this workflow:
1. Test thoroughly in a staging environment
2. Update documentation for any changes
3. Consider backwards compatibility
4. Add appropriate error handling

## 📞 Support

For issues with this workflow:
1. Check the troubleshooting section above
2. Review Make.com execution logs
3. Verify HiBob API connectivity
4. Contact your IT or HR systems administrator

---

**Note**: Remember to replace all placeholder URLs and API tokens with your actual values before deploying to production.