/**
 * 笔记服务
 * 用于与后端 API 交互，保存、获取、更新和删除笔记
 */

import axios from 'axios';

// 确保 axios 请求带有凭证
axios.defaults.withCredentials = true;

// 获取所有笔记
export const getAllNotes = async () => {
  try {
    const response = await axios.get('/api/notes');

    if (!response.ok && !response.status.toString().startsWith('2')) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取笔记失败');
    }

    return response.data;
  } catch (error) {
    console.error('获取笔记失败:', error);
    throw error;
  }
};

// 获取单个笔记
export const getNoteById = async (noteId) => {
  try {
    const response = await axios.get(`/api/notes/${noteId}`);

    if (!response.ok && !response.status.toString().startsWith('2')) {
      const errorData = await response.json();
      throw new Error(errorData.error || '获取笔记失败');
    }

    return response.data;
  } catch (error) {
    console.error('获取笔记失败:', error);
    throw error;
  }
};

// 创建笔记
export const createNote = async (noteData) => {
  try {
    const response = await axios.post('/api/notes', noteData);

    if (!response.ok && !response.status.toString().startsWith('2')) {
      const errorData = await response.json();
      throw new Error(errorData.error || '创建笔记失败');
    }

    return response.data;
  } catch (error) {
    console.error('创建笔记失败:', error);
    throw error;
  }
};

// 更新笔记
export const updateNote = async (noteId, noteData) => {
  try {
    const response = await axios.put(`/api/notes/${noteId}`, noteData);

    if (!response.ok && !response.status.toString().startsWith('2')) {
      const errorData = await response.json();
      throw new Error(errorData.error || '更新笔记失败');
    }

    return response.data;
  } catch (error) {
    console.error('更新笔记失败:', error);
    throw error;
  }
};

// 删除笔记
export const deleteNote = async (noteId) => {
  try {
    const response = await axios.delete(`/api/notes/${noteId}`);

    if (!response.ok && !response.status.toString().startsWith('2')) {
      const errorData = await response.json();
      throw new Error(errorData.error || '删除笔记失败');
    }

    return response.data;
  } catch (error) {
    console.error('删除笔记失败:', error);
    throw error;
  }
};
