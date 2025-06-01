import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * 获取用户的所有收藏
 * @returns {Promise} - 包含收藏数据的Promise
 */
export const getUserBookmarks = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未授权，请先登录');
    }

    const response = await axios.get(`${API_URL}/bookmarks`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('获取收藏失败:', error);
    throw error;
  }
};

/**
 * 创建新收藏
 * @param {Object} bookmarkData - 收藏数据对象
 * @param {string} bookmarkData.exerciseId - 练习ID
 * @param {string} bookmarkData.exerciseTitle - 练习标题
 * @param {Array} bookmarkData.tags - 练习课程
 * @returns {Promise} - 包含新收藏数据的Promise
 */
export const createBookmark = async (bookmarkData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未授权，请先登录');
    }

    const response = await axios.post(`${API_URL}/bookmarks`, bookmarkData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data.data;
  } catch (error) {
    console.error('创建收藏失败:', error);
    throw error;
  }
};

/**
 * 删除收藏
 * @param {string} bookmarkId - 收藏ID
 * @returns {Promise} - 包含删除结果的Promise
 */
export const deleteBookmark = async (bookmarkId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未授权，请先登录');
    }

    const response = await axios.delete(`${API_URL}/bookmarks/${bookmarkId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('删除收藏失败:', error);
    throw error;
  }
};

/**
 * 通过练习ID删除收藏
 * @param {string} exerciseId - 练习ID
 * @returns {Promise} - 包含删除结果的Promise
 */
export const deleteBookmarkByExerciseId = async (exerciseId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('未授权，请先登录');
    }

    const response = await axios.delete(`${API_URL}/bookmarks/exercise/${exerciseId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('删除收藏失败:', error);
    throw error;
  }
}; 