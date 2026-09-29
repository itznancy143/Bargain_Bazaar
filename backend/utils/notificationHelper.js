import Notification from '../models/Notification.js';

/**
 * Helper to create a database-backed notification safely without blocking parent operations.
 *
 * @param {Object} options
 * @param {string|mongoose.Types.ObjectId} options.recipient - User receiving notification
 * @param {string} options.eventKey - Stable key for this business event, used for idempotency
 * @param {string} options.type - Notification event category
 * @param {string} options.title - Short header
 * @param {string} options.message - Descriptive text
 * @param {string} [options.link] - Frontend route to navigate on click
 * @param {string|mongoose.Types.ObjectId} [options.product] - Optional product reference
 * @param {string|mongoose.Types.ObjectId} [options.offer] - Optional offer reference
 * @param {string|mongoose.Types.ObjectId} [options.order] - Optional order reference
 * @param {string|mongoose.Types.ObjectId} [options.review] - Optional review reference
 * @returns {Promise<Notification|null>}
 */
export const createNotification = async ({
  recipient,
  eventKey,
  type,
  title,
  message,
  link = '',
  product = null,
  offer = null,
  order = null,
  review = null
}) => {
  try {
    if (!recipient || !eventKey) return null;

    const dedupeKey = `${recipient.toString()}:${eventKey}`;
    const existingNotification = await Notification.findOne({ dedupeKey });

    if (existingNotification) return existingNotification;

    try {
      return await Notification.create({
        recipient,
        dedupeKey,
        type,
        title,
        message,
        link,
        product: product || null,
        offer: offer || null,
        order: order || null,
        review: review || null,
        read: false
      });
    } catch (error) {
      if (error.code === 11000) {
        return Notification.findOne({ dedupeKey });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

export default createNotification;
