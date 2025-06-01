const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { jwtSecret } = require('../config/jwt');

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: '用户名和密码不能为空' 
    });
  }
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: '用户名已存在' 
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: '注册失败' 
    });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: '用户名和密码不能为空' 
    });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false,
        message: '用户名或密码错误' 
      });
    }
    const token = jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '1h' });
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: '登录失败' 
    });
  }
};
