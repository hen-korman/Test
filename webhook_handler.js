/**
 * Webhook Handler for Make.com Baby Congratulations Form
 * This script can be used as a backup webhook handler or for local testing
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const CONFIG = {
    MAKE_COM_WEBHOOK_URL: process.env.MAKE_COM_WEBHOOK_URL || 'YOUR_MAKE_COM_WEBHOOK_URL_HERE',
    HIBOB_API_TOKEN: process.env.HIBOB_API_TOKEN || 'YOUR_HIBOB_API_TOKEN',
    HIBOB_API_BASE_URL: 'https://api.hibob.com/v1',
    HR_EMAIL: process.env.HR_EMAIL || 'hr@company.com'
};

// Validation functions
function validateEmployeeData(data) {
    const required = ['employeeId', 'employeeName', 'employeeEmail'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.employeeEmail)) {
        throw new Error('Invalid email format');
    }
    
    return true;
}

function validateBabyData(data) {
    const required = ['babyName', 'babyGender', 'babyBirthDate', 'relationship'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required baby information: ${missing.join(', ')}`);
    }
    
    // Date validation
    const birthDate = new Date(data.babyBirthDate);
    const today = new Date();
    if (birthDate > today) {
        throw new Error('Birth date cannot be in the future');
    }
    
    // Check if birth date is reasonable (not more than 1 year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (birthDate < oneYearAgo) {
        console.warn('Birth date is more than one year ago, please verify');
    }
    
    return true;
}

// Data transformation functions
function transformDataForHiBob(formData) {
    const nameParts = formData.babyName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
        employee: {
            id: formData.employeeId,
            email: formData.employeeEmail,
            name: formData.employeeName
        },
        dependent: {
            firstName: firstName,
            lastName: lastName,
            relationship: 'child', // HiBob uses 'child' for babies
            dateOfBirth: formData.babyBirthDate,
            gender: formData.babyGender,
            addedDate: new Date().toISOString().split('T')[0]
        },
        metadata: {
            formSubmissionDate: formData.submissionTime || new Date().toISOString(),
            parentRelationship: formData.relationship,
            requestsParentalLeave: formData.requestMaternityPaternity === 'yes',
            requestsBenefitsInfo: formData.requestBenefitsInfo === 'yes',
            additionalNotes: formData.additionalNotes || '',
            birthWeight: formData.babyWeight || '',
            birthLength: formData.babyLength || ''
        }
    };
}

// HiBob API functions
async function addDependentToHiBob(employeeId, dependentData) {
    try {
        const response = await axios.post(
            `${CONFIG.HIBOB_API_BASE_URL}/people/${employeeId}/dependents`,
            dependentData,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.HIBOB_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error adding dependent to HiBob:', error.response?.data || error.message);
        throw error;
    }
}

async function updateEmployeeNotes(employeeId, notes) {
    try {
        const updateData = {
            work: {
                customFields: {
                    lastFamilyEvent: `New baby: ${notes.babyName} born ${notes.birthDate}`,
                    parentalLeaveRequested: notes.requestsParentalLeave ? 'Yes' : 'No',
                    benefitsInfoRequested: notes.requestsBenefitsInfo ? 'Yes' : 'No',
                    lastUpdated: new Date().toISOString()
                }
            }
        };
        
        const response = await axios.patch(
            `${CONFIG.HIBOB_API_BASE_URL}/people/${employeeId}`,
            updateData,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.HIBOB_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data;
    } catch (error) {
        console.error('Error updating employee notes in HiBob:', error.response?.data || error.message);
        // Don't throw error for notes update failure, as it's not critical
        return null;
    }
}

// Email notification functions
async function sendHRNotification(transformedData) {
    const emailData = {
        to: CONFIG.HR_EMAIL,
        subject: `New Baby Form Completed - ${transformedData.employee.name}`,
        body: `
HR Notification: New Baby Form Completed

Employee: ${transformedData.employee.name} (${transformedData.employee.id})
Email: ${transformedData.employee.email}

Baby Information:
- Name: ${transformedData.dependent.firstName} ${transformedData.dependent.lastName}
- Birth Date: ${transformedData.dependent.dateOfBirth}
- Gender: ${transformedData.dependent.gender}
- Parent Relationship: ${transformedData.metadata.parentRelationship}

Requests:
- Parental Leave Info: ${transformedData.metadata.requestsParentalLeave ? 'Yes' : 'No'}
- Benefits Info: ${transformedData.metadata.requestsBenefitsInfo ? 'Yes' : 'No'}

Additional Information:
- Birth Weight: ${transformedData.metadata.birthWeight || 'Not provided'}
- Birth Length: ${transformedData.metadata.birthLength || 'Not provided'}
- Additional Notes: ${transformedData.metadata.additionalNotes || 'None'}

Form submitted at: ${transformedData.metadata.formSubmissionDate}

Data has been successfully uploaded to HiBob.
Please follow up with the employee regarding any requested information.
        `.trim()
    };
    
    // In a real implementation, you would send this via your email service
    console.log('HR Notification Email:', emailData);
    
    // If using Make.com for email, forward to webhook
    try {
        await axios.post(CONFIG.MAKE_COM_WEBHOOK_URL, {
            action: 'send_hr_notification',
            emailData: emailData
        });
    } catch (error) {
        console.error('Error sending HR notification via Make.com:', error.message);
    }
}

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// HR trigger endpoint (to initiate the congratulations email)
app.post('/api/hr-trigger', async (req, res) => {
    try {
        console.log('HR trigger received:', req.body);
        
        validateEmployeeData(req.body);
        
        // Forward to Make.com webhook
        const response = await axios.post(CONFIG.MAKE_COM_WEBHOOK_URL, {
            action: 'hr_trigger',
            ...req.body,
            triggerTime: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'HR trigger processed successfully',
            makecomResponse: response.status
        });
        
    } catch (error) {
        console.error('Error processing HR trigger:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// Form submission endpoint
app.post('/api/baby-form-submission', async (req, res) => {
    try {
        console.log('Form submission received:', req.body);
        
        // Validate the form data
        validateEmployeeData(req.body);
        validateBabyData(req.body);
        
        // Transform data for HiBob
        const transformedData = transformDataForHiBob(req.body);
        
        // Add dependent to HiBob
        console.log('Adding dependent to HiBob...');
        const hibobResponse = await addDependentToHiBob(
            transformedData.employee.id,
            transformedData.dependent
        );
        
        // Update employee notes (optional, non-critical)
        console.log('Updating employee notes...');
        await updateEmployeeNotes(transformedData.employee.id, {
            babyName: `${transformedData.dependent.firstName} ${transformedData.dependent.lastName}`,
            birthDate: transformedData.dependent.dateOfBirth,
            requestsParentalLeave: transformedData.metadata.requestsParentalLeave,
            requestsBenefitsInfo: transformedData.metadata.requestsBenefitsInfo
        });
        
        // Send HR notification
        console.log('Sending HR notification...');
        await sendHRNotification(transformedData);
        
        // Forward to Make.com webhook for any additional processing
        await axios.post(CONFIG.MAKE_COM_WEBHOOK_URL, {
            action: 'form_submission_complete',
            originalData: req.body,
            transformedData: transformedData,
            hibobResponse: hibobResponse,
            processedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Baby information submitted successfully',
            data: {
                employeeName: transformedData.employee.name,
                babyName: `${transformedData.dependent.firstName} ${transformedData.dependent.lastName}`,
                submissionId: hibobResponse?.id || 'pending'
            }
        });
        
    } catch (error) {
        console.error('Error processing form submission:', error);
        
        // Log error details for debugging
        if (error.response) {
            console.error('API Error Response:', error.response.data);
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to process baby information',
            details: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Webhook handler server running on port ${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/health`);
        console.log(`HR Trigger: POST http://localhost:${PORT}/api/hr-trigger`);
        console.log(`Form Submission: POST http://localhost:${PORT}/api/baby-form-submission`);
        
        // Warn about missing configuration
        if (CONFIG.MAKE_COM_WEBHOOK_URL === 'YOUR_MAKE_COM_WEBHOOK_URL_HERE') {
            console.warn('⚠️  MAKE_COM_WEBHOOK_URL not configured');
        }
        if (CONFIG.HIBOB_API_TOKEN === 'YOUR_HIBOB_API_TOKEN') {
            console.warn('⚠️  HIBOB_API_TOKEN not configured');
        }
    });
}

module.exports = app;