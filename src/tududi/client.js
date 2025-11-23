const axios = require('axios');
const logger = require('../utils/logger');

class TududuClient {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiToken = config.apiToken;
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createTask(taskData) {
    try {
      logger.info(`Creating task: ${taskData.name}`);
      logger.info(`Task payload: ${JSON.stringify(taskData, null, 2)}`);
      const response = await this.axiosInstance.post('/api/task', taskData);
      logger.info(`Task created with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      const errorDetails = error.response?.data || error.message;
      logger.error(`Failed to create task: ${error.message}`);
      logger.error(`API Response: ${JSON.stringify(errorDetails, null, 2)}`);
      throw error;
    }
  }

  async getTasks(filters = {}) {
    try {
      const response = await this.axiosInstance.get('/api/tasks', {
        params: filters
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get tasks: ${error.message}`);
      throw error;
    }
  }

  async getTask(taskId) {
    try {
      const response = await this.axiosInstance.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async updateTask(taskId, updates) {
    try {
      logger.info(`Updating task ${taskId}`);
      const response = await this.axiosInstance.patch(
        `/api/tasks/${taskId}`,
        updates
      );
      logger.info(`Task ${taskId} updated`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      logger.info(`Deleting task ${taskId}`);
      await this.axiosInstance.delete(`/api/tasks/${taskId}`);
      logger.info(`Task ${taskId} deleted`);
    } catch (error) {
      logger.error(`Failed to delete task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async getProjects() {
    try {
      const response = await this.axiosInstance.get('/api/projects');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get projects: ${error.message}`);
      throw error;
    }
  }

  async getAreas() {
    try {
      const response = await this.axiosInstance.get('/api/areas');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get areas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TududuClient;
