// Expo Push Notification Service
const { Expo } = require('expo-server-sdk');

class ExpoPushService {
  constructor() {
    // Create a new Expo SDK client
    this.expo = new Expo({
      accessToken: process.env.EXPO_ACCESS_TOKEN, // Optional: for higher rate limits
      useFcmV1: false, // Use legacy FCM format for better compatibility
    });
    
    console.log('🔔 Expo Push Service initialized');
  }

  async sendYoNotification(expoPushToken, fromUser) {
    try {
      // Check that the push token is valid
      if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Invalid Expo push token: ${expoPushToken}`);
        return { success: false, error: 'Invalid push token' };
      }

      // Construct the message
      const message = {
        to: expoPushToken,
        sound: 'default', // Will use your custom sound from app.json
        title: 'Yo!',
        body: `${fromUser} sent you a Yo!`,
        data: {
          type: 'yo',
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
        channelId: 'yo-notifications',
      };

      console.log('📤 Sending Yo notification:', { to: expoPushToken, fromUser });

      // Send the notification
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Check if the notification was sent successfully
      if (tickets.length > 0) {
        const ticket = tickets[0];
        if (ticket.status === 'ok') {
          console.log('✅ Yo notification sent successfully');
          return { success: true, ticket };
        } else {
          console.error('❌ Notification failed:', ticket);
          return { success: false, error: ticket.message };
        }
      } else {
        return { success: false, error: 'No tickets received' };
      }
    } catch (error) {
      console.error('❌ Error sending Yo notification:', error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleTokens(expoPushTokens, fromUser) {
    try {
      // Filter out invalid tokens
      const validTokens = expoPushTokens.filter(token => Expo.isExpoPushToken(token));
      
      if (validTokens.length === 0) {
        return { success: false, error: 'No valid push tokens' };
      }

      // Create messages for all valid tokens
      const messages = validTokens.map(token => ({
        to: token,
        sound: 'default',
        title: 'Yo!',
        body: `${fromUser} sent you a Yo!`,
        data: {
          type: 'yo',
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
        },
        priority: 'high',
        channelId: 'yo-notifications',
      }));

      console.log(`📤 Sending Yo notifications to ${validTokens.length} devices`);

      // Send the notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Count successful and failed notifications
      let successCount = 0;
      let failureCount = 0;

      tickets.forEach(ticket => {
        if (ticket.status === 'ok') {
          successCount++;
        } else {
          failureCount++;
          console.error('Failed ticket:', ticket);
        }
      });

      console.log(`✅ Sent to ${successCount}/${validTokens.length} devices`);

      return {
        success: true,
        successCount,
        failureCount,
        totalSent: validTokens.length
      };
    } catch (error) {
      console.error('❌ Error sending multicast notifications:', error);
      return { success: false, error: error.message };
    }
  }

  async handlePushReceipts(receiptIds) {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      
      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
          
          // Process receipts to handle errors
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];
            
            if (receipt.status === 'ok') {
              continue;
            } else if (receipt.status === 'error') {
              console.error(`Error in receipt ${receiptId}:`, receipt.message);
              
              if (receipt.details && receipt.details.error) {
                const errorCode = receipt.details.error;
                
                if (errorCode === 'DeviceNotRegistered') {
                  // The device token is no longer valid, remove it from database
                  console.log('Device token is no longer valid:', receiptId);
                  // TODO: Remove invalid token from database
                }
              }
            }
          }
        } catch (error) {
          console.error('Error getting receipts:', error);
        }
      }
    } catch (error) {
      console.error('Error handling push receipts:', error);
    }
  }
}

module.exports = new ExpoPushService();
