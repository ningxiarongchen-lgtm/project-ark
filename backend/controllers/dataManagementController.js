/**
 * 通用数据管理控制器
 * 提供CRUD和批量导入功能的基础方法
 */

const { generateTemplateForModel } = require('../utils/csvTemplateGenerator');
const { importDataFromFile } = require('../utils/dataImporter');
const fs = require('fs').promises;

/**
 * 创建通用的CRUD控制器
 * @param {mongoose.Model} Model - Mongoose模型
 * @param {Object} options - 可选配置
 * @returns {Object} 控制器方法集合
 */
function createCrudController(Model, options = {}) {
  const {
    populateFields = [],
    searchFields = ['name'],
    uniqueField = null,
    customValidation = null
  } = options;
  
  return {
    // 获取所有记录
    getAll: async (req, res) => {
      try {
        const {
          page = 1,
          limit = 50,
          search = '',
          sortBy = 'createdAt',
          sortOrder = 'desc',
          ...filters
        } = req.query;
        
        // 构建查询
        let query = {};
        
        // 搜索功能
        if (search) {
          const searchConditions = searchFields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
          }));
          query.$or = searchConditions;
        }
        
        // 添加过滤条件
        Object.assign(query, filters);
        
        // 分页
        const skip = (page - 1) * limit;
        
        // 执行查询
        let queryBuilder = Model.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(parseInt(limit));
        
        // 填充关联字段
        if (populateFields.length > 0) {
          populateFields.forEach(field => {
            queryBuilder = queryBuilder.populate(field);
          });
        }
        
        const data = await queryBuilder;
        const total = await Model.countDocuments(query);
        
        res.json({
          success: true,
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '获取数据失败',
          error: error.message
        });
      }
    },
    
    // 根据ID获取单个记录
    getById: async (req, res) => {
      try {
        let query = Model.findById(req.params.id);
        
        // 填充关联字段
        if (populateFields.length > 0) {
          populateFields.forEach(field => {
            query = query.populate(field);
          });
        }
        
        const data = await query;
        
        if (!data) {
          return res.status(404).json({
            success: false,
            message: '未找到记录'
          });
        }
        
        res.json({
          success: true,
          data
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '获取数据失败',
          error: error.message
        });
      }
    },
    
    // 创建新记录
    create: async (req, res) => {
      try {
        // 应用自定义验证
        if (customValidation) {
          const errors = customValidation(req.body);
          if (errors && errors.length > 0) {
            return res.status(400).json({
              success: false,
              message: '验证失败',
              errors
            });
          }
        }
        
        const newData = await Model.create(req.body);
        
        res.status(201).json({
          success: true,
          message: '创建成功',
          data: newData
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: '创建失败',
          error: error.message
        });
      }
    },
    
    // 更新记录
    update: async (req, res) => {
      try {
        // 应用自定义验证
        if (customValidation) {
          const errors = customValidation(req.body);
          if (errors && errors.length > 0) {
            return res.status(400).json({
              success: false,
              message: '验证失败',
              errors
            });
          }
        }
        
        const updatedData = await Model.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true, runValidators: true }
        );
        
        if (!updatedData) {
          return res.status(404).json({
            success: false,
            message: '未找到记录'
          });
        }
        
        res.json({
          success: true,
          message: '更新成功',
          data: updatedData
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: '更新失败',
          error: error.message
        });
      }
    },
    
    // 删除记录
    delete: async (req, res) => {
      try {
        const deletedData = await Model.findByIdAndDelete(req.params.id);
        
        if (!deletedData) {
          return res.status(404).json({
            success: false,
            message: '未找到记录'
          });
        }
        
        res.json({
          success: true,
          message: '删除成功'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '删除失败',
          error: error.message
        });
      }
    },
    
    // 批量删除
    bulkDelete: async (req, res) => {
      try {
        const { ids } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({
            success: false,
            message: '请提供要删除的ID列表'
          });
        }
        
        const result = await Model.deleteMany({ _id: { $in: ids } });
        
        res.json({
          success: true,
          message: `成功删除 ${result.deletedCount} 条记录`,
          deletedCount: result.deletedCount
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '批量删除失败',
          error: error.message
        });
      }
    },
    
    // 下载CSV模板
    downloadTemplate: async (req, res) => {
      try {
        const result = await generateTemplateForModel(Model);
        
        // 读取文件
        const fileBuffer = await fs.readFile(result.filePath);
        
        // 设置响应头
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        
        // 发送文件
        res.send(fileBuffer);
        
        // 删除临时文件
        await fs.unlink(result.filePath);
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '生成模板失败',
          error: error.message
        });
      }
    },
    
    // 批量上传导入
    bulkImport: async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: '请上传文件'
          });
        }
        
        const importOptions = {
          updateOnDuplicate: req.body.updateOnDuplicate === 'true',
          uniqueField: uniqueField,
          customValidation: customValidation ? { validate: customValidation } : undefined
        };
        
        const result = await importDataFromFile(
          req.file.buffer,
          req.file.originalname,
          Model,
          importOptions
        );
        
        if (!result.success) {
          return res.status(400).json(result);
        }
        
        res.json({
          success: true,
          message: '导入完成',
          ...result
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: '导入失败',
          error: error.message
        });
      }
    }
  };
}

module.exports = {
  createCrudController
};

