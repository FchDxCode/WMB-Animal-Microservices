import { StatusHistory, HistoryLayanan } from '../models/historyModels.js';
import { Op } from 'sequelize';

// Get history user yang sedang login
export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await HistoryLayanan.findAll({
      where: { user_id: userId },
      include: [
        {
          model: StatusHistory,
          as: 'statusHistory',
          attributes: ['nama', 'slug']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      success: true,
      message: 'History retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Error retrieving user history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve history',
      error: error.message
    });
  }
};

// Get detail history
export const getHistoryDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const history = await HistoryLayanan.findOne({
      where: { 
        id: id,
        user_id: userId 
      },
      include: [
        {
          model: StatusHistory,
          as: 'statusHistory',
          attributes: ['nama', 'slug']
        }
      ]
    });

    if (!history) {
      return res.status(404).json({
        success: false,
        message: 'History not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'History detail retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error('Error retrieving history detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve history detail',
      error: error.message
    });
  }
};

// List all history (admin)
export const getAllHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await HistoryLayanan.findAndCountAll({
      include: [
        {
          model: StatusHistory,
          as: 'statusHistory',
          attributes: ['nama', 'slug']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: 'All history retrieved successfully',
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving all history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve history list',
      error: error.message
    });
  }
};

// Get history by status
export const getHistoryByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Cari status_history_id berdasarkan slug
    const statusRecord = await StatusHistory.findOne({
      where: { slug: status }
    });

    if (!statusRecord) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    const { count, rows } = await HistoryLayanan.findAndCountAll({
      where: { 
        user_id: userId,
        status_history_id: statusRecord.id 
      },
      include: [
        {
          model: StatusHistory,
          as: 'statusHistory',
          attributes: ['nama', 'slug']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json({
      success: true,
      message: `History with status ${status} retrieved successfully`,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error retrieving history by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve history by status',
      error: error.message
    });
  }
};