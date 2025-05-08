/**
 * 本地存储服务 - 替代 MongoDB 数据库
 * 使用内存存储数据，服务器重启后数据会丢失
 */

// 内存存储
const storage = {
  sessions: []
};

/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
const generateId = () => {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 保存学习会话
 * @param {Object} sessionData - 会话数据
 * @returns {Object} 保存的会话数据，包含ID
 */
const saveSession = (sessionData) => {
  const sessionId = generateId();
  const timestamp = new Date().toISOString();
  
  const session = {
    sessionId,
    ...sessionData,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  storage.sessions.push(session);
  console.log(`Session saved with ID: ${sessionId}`);
  
  return session;
};

/**
 * 获取会话数据
 * @param {string} sessionId - 会话ID
 * @returns {Object|null} 会话数据或null
 */
const getSession = (sessionId) => {
  const session = storage.sessions.find(s => s.sessionId === sessionId);
  return session || null;
};

/**
 * 获取所有会话
 * @param {number} limit - 限制返回数量
 * @returns {Array} 会话数组
 */
const getAllSessions = (limit = 10) => {
  // 按创建时间倒序排列
  return storage.sessions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

/**
 * 更新会话数据
 * @param {string} sessionId - 会话ID
 * @param {Object} updateData - 更新数据
 * @returns {Object|null} 更新后的会话数据或null
 */
const updateSession = (sessionId, updateData) => {
  const index = storage.sessions.findIndex(s => s.sessionId === sessionId);
  
  if (index === -1) {
    return null;
  }
  
  const session = storage.sessions[index];
  const updatedSession = {
    ...session,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  storage.sessions[index] = updatedSession;
  return updatedSession;
};

/**
 * 删除会话
 * @param {string} sessionId - 会话ID
 * @returns {boolean} 是否成功删除
 */
const deleteSession = (sessionId) => {
  const initialLength = storage.sessions.length;
  storage.sessions = storage.sessions.filter(s => s.sessionId !== sessionId);
  
  return storage.sessions.length < initialLength;
};

module.exports = {
  saveSession,
  getSession,
  getAllSessions,
  updateSession,
  deleteSession
};
