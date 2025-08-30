const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    // Gmail SMTP configuration
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
    // Request submission notification to admin
    requestSubmitted: (requestData) => ({
        subject: '⚾ New Umpire/Staff Request Submitted',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">⚾ Baseball Schedule Manager</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">New Request Submitted</p>
                </div>
                
                <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-top: 0;">New Request Details</h2>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Game Information</h3>
                        <p><strong>Date:</strong> ${requestData.gameDate}</p>
                        <p><strong>Time:</strong> ${requestData.gameTime}</p>
                        <p><strong>Teams:</strong> ${requestData.homeTeam} vs ${requestData.visitorTeam}</p>
                        <p><strong>Venue:</strong> ${requestData.venue}</p>
                        <p><strong>Division:</strong> ${requestData.division}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Request Changes</h3>
                        ${requestData.plateUmpireChange ? `<p><strong>Plate Umpire:</strong> ${requestData.currentPlateUmpire} → ${requestData.requestedPlateUmpire}</p>` : ''}
                        ${requestData.baseUmpireChange ? `<p><strong>Base Umpire:</strong> ${requestData.currentBaseUmpire} → ${requestData.requestedBaseUmpire}</p>` : ''}
                        ${requestData.concessionStaffChange ? `<p><strong>Concession Staff:</strong> ${requestData.currentConcessionStaff} → ${requestData.requestedConcessionStaff}</p>` : ''}
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Requester Information</h3>
                        <p><strong>Name:</strong> ${requestData.requesterName}</p>
                        <p><strong>Email:</strong> ${requestData.requesterEmail}</p>
                        <p><strong>Phone:</strong> ${requestData.requesterPhone}</p>
                        <p><strong>Reason:</strong> ${requestData.reason}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin'}" 
                           style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                            Review Request
                        </a>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>This is an automated notification from Baseball Schedule Manager</p>
                    <p>Please log in to the admin panel to review and respond to this request</p>
                </div>
            </div>
        `
    }),

    // Request approved notification to user
    requestApproved: (requestData) => ({
        subject: '✅ Your Umpire/Staff Request Has Been Approved',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">⚾ Baseball Schedule Manager</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Request Approved ✅</p>
                </div>
                
                <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #059669; margin-top: 0;">Great News! Your Request Has Been Approved</h2>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Game Information</h3>
                        <p><strong>Date:</strong> ${requestData.gameDate}</p>
                        <p><strong>Time:</strong> ${requestData.gameTime}</p>
                        <p><strong>Teams:</strong> ${requestData.homeTeam} vs ${requestData.visitorTeam}</p>
                        <p><strong>Venue:</strong> ${requestData.venue}</p>
                        <p><strong>Division:</strong> ${requestData.division}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Approved Changes</h3>
                        ${requestData.plateUmpireChange ? `<p><strong>Plate Umpire:</strong> ${requestData.currentPlateUmpire} → <span style="color: #059669; font-weight: bold;">${requestData.requestedPlateUmpire}</span></p>` : ''}
                        ${requestData.baseUmpireChange ? `<p><strong>Base Umpire:</strong> ${requestData.currentBaseUmpire} → <span style="color: #059669; font-weight: bold;">${requestData.requestedBaseUmpire}</span></p>` : ''}
                        ${requestData.concessionStaffChange ? `<p><strong>Concession Staff:</strong> ${requestData.currentConcessionStaff} → <span style="color: #059669; font-weight: bold;">${requestData.requestedConcessionStaff}</span></p>` : ''}
                    </div>
                    
                    <div style="background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #065f46; font-weight: bold;">
                            🎉 Your request has been approved and the schedule has been updated!
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Admin Notes</h3>
                        <p style="color: #6b7280; font-style: italic;">${requestData.adminNotes || 'No additional notes provided.'}</p>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>This is an automated notification from Baseball Schedule Manager</p>
                    <p>Thank you for using our system!</p>
                </div>
            </div>
        `
    }),

    // Request rejected notification to user
    requestRejected: (requestData) => ({
        subject: '❌ Your Umpire/Staff Request Has Been Rejected',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">⚾ Baseball Schedule Manager</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Request Rejected ❌</p>
                </div>
                
                <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-top: 0;">Request Status Update</h2>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Game Information</h3>
                        <p><strong>Date:</strong> ${requestData.gameDate}</p>
                        <p><strong>Time:</strong> ${requestData.gameTime}</p>
                        <p><strong>Teams:</strong> ${requestData.homeTeam} vs ${requestData.visitorTeam}</p>
                        <p><strong>Venue:</strong> ${requestData.venue}</p>
                        <p><strong>Division:</strong> ${requestData.division}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Requested Changes</h3>
                        ${requestData.plateUmpireChange ? `<p><strong>Plate Umpire:</strong> ${requestData.currentPlateUmpire} → ${requestData.requestedPlateUmpire}</p>` : ''}
                        ${requestData.baseUmpireChange ? `<p><strong>Base Umpire:</strong> ${requestData.currentBaseUmpire} → ${requestData.requestedBaseUmpire}</p>` : ''}
                        ${requestData.concessionStaffChange ? `<p><strong>Concession Staff:</strong> ${requestData.currentConcessionStaff} → ${requestData.requestedConcessionStaff}</p>` : ''}
                    </div>
                    
                    <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #991b1b; font-weight: bold;">
                            ❌ Your request has been rejected. The schedule remains unchanged.
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Rejection Reason</h3>
                        <p style="color: #6b7280; font-style: italic;">${requestData.adminNotes || 'No reason provided.'}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Next Steps</h3>
                        <p>If you have questions about this decision, please contact the admin team.</p>
                        <p>You may submit a new request with different requirements if needed.</p>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>This is an automated notification from Baseball Schedule Manager</p>
                    <p>Thank you for understanding.</p>
                </div>
            </div>
        `
    }),

    // Notification to assigned umpires/staff
    assignmentNotification: (assignmentData) => ({
        subject: '⚾ New Assignment - Umpire/Staff Role',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">⚾ Baseball Schedule Manager</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">New Assignment</p>
                </div>
                
                <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #0891b2; margin-top: 0;">You Have Been Assigned to a Game</h2>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Game Information</h3>
                        <p><strong>Date:</strong> ${assignmentData.gameDate}</p>
                        <p><strong>Time:</strong> ${assignmentData.gameTime}</p>
                        <p><strong>Teams:</strong> ${assignmentData.homeTeam} vs ${assignmentData.visitorTeam}</p>
                        <p><strong>Venue:</strong> ${assignmentData.venue}</p>
                        <p><strong>Division:</strong> ${assignmentData.division}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Your Assignment</h3>
                        <p><strong>Role:</strong> <span style="color: #0891b2; font-weight: bold;">${assignmentData.role}</span></p>
                        <p><strong>Position:</strong> ${assignmentData.position}</p>
                        <p><strong>Assigned By:</strong> ${assignmentData.assignedBy}</p>
                        <p><strong>Assignment Date:</strong> ${assignmentData.assignmentDate}</p>
                    </div>
                    
                    <div style="background: #dbeafe; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #1e40af; font-weight: bold;">
                            📅 Please mark this date and time in your calendar
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3 style="color: #374151; margin-bottom: 10px;">Important Notes</h3>
                        <p>• Please arrive at least 30 minutes before game time</p>
                        <p>• Bring appropriate equipment and attire</p>
                        <p>• Contact the admin team if you need to request a change</p>
                    </div>
                </div>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                    <p>This is an automated notification from Baseball Schedule Manager</p>
                    <p>Thank you for your service to the league!</p>
                </div>
            </div>
        `
    })
};

// Email sending functions
const emailService = {
    // Send email notification
    async sendEmail(to, template, data) {
        try {
            const mailOptions = {
                from: `"Baseball Schedule Manager" <${emailConfig.auth.user}>`,
                to: to,
                ...template(data)
            };

            const result = await transporter.sendMail(mailOptions);
            console.log('✅ Email sent successfully:', result.messageId);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Send request submission notification to admin
    async notifyAdminOfRequest(requestData) {
        const adminEmails = process.env.ADMIN_EMAILS ? 
            process.env.ADMIN_EMAILS.split(',') : 
            ['admin@baseball.com'];
        
        const results = [];
        for (const email of adminEmails) {
            const result = await this.sendEmail(email, emailTemplates.requestSubmitted, requestData);
            results.push({ email, result });
        }
        
        return results;
    },

    // Send approval/rejection notification to user
    async notifyUserOfDecision(requestData) {
        if (!requestData.requesterEmail) {
            console.log('⚠️ No requester email found for notification');
            return { success: false, error: 'No requester email' };
        }

        const template = requestData.status === 'approved' ? 
            emailTemplates.requestApproved : 
            emailTemplates.requestRejected;
        
        return await this.sendEmail(requestData.requesterEmail, template, requestData);
    },

    // Send assignment notification to umpires/staff
    async notifyAssignment(assignmentData) {
        const emails = [];
        
        if (assignmentData.plateUmpireEmail) {
            emails.push({
                email: assignmentData.plateUmpireEmail,
                role: 'Plate Umpire',
                position: assignmentData.plateUmpire
            });
        }
        
        if (assignmentData.baseUmpireEmail) {
            emails.push({
                email: assignmentData.baseUmpireEmail,
                role: 'Base Umpire',
                position: assignmentData.baseUmpire
            });
        }
        
        if (assignmentData.concessionStaffEmail) {
            emails.push({
                email: assignmentData.concessionStaffEmail,
                role: 'Concession Staff',
                position: assignmentData.concessionStaff
            });
        }

        const results = [];
        for (const emailData of emails) {
            const result = await this.sendEmail(
                emailData.email, 
                emailTemplates.assignmentNotification, 
                { ...assignmentData, role: emailData.role, position: emailData.position }
            );
            results.push({ email: emailData.email, role: emailData.role, result });
        }
        
        return results;
    }
};

module.exports = { emailService, emailTemplates };
