const users = [] // 简单内存存储，正式项目用数据库

exports.register = (req, res) => {
  const { username, password } = req.body
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ success: false, message: '用户已存在' })
  }
  const newUser = { id: Date.now().toString(), username, password }
  users.push(newUser)
  res.json({ success: true, token: 'fake-jwt-token', user: { id: newUser.id, username } })
}

exports.login = (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username && u.password === password)
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }
  res.json({ success: true, token: 'fake-jwt-token', user: { id: user.id, username } })
}
