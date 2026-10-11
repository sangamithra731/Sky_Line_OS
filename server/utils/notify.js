import Notification from "../models/Notification.js";

export async function notifyUser(userId, data) {
  try {
    return await Notification.create({ user: userId, ...data });
  } catch (err) {
    console.error("Notification error:", err.message);
    return null;
  }
}

export async function notifyMany(userIds, data) {
  if (!userIds || userIds.length === 0) return [];
  try {
    const docs = userIds.map((user) => ({ user, ...data }));
    return await Notification.insertMany(docs);
  } catch (err) {
    console.error("Bulk notification error:", err.message);
    return [];
  }
}

export async function notifyRole(role, data, User) {
  try {
    const users = await User.find({ role }).select("_id");
    return await notifyMany(users.map((u) => u._id), data);
  } catch (err) {
    console.error("Role notification error:", err.message);
    return [];
  }
}
