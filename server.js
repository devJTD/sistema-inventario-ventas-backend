// Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

/* Configuración Inicial */
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_super_seguro_para_jwt';
const app = express();
const PORT = process.env.PORT || 3002;

/* Middlewares Globales */
app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

/* Configuración de Archivos de Datos */
const dataPath = path.join(__dirname, 'data');

/* Funciones de Utilidad para Archivos JSON */
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(dataPath, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`El archivo ${filename} no existe o está vacío. Se inicializa como []`);
      return [];
    }
    console.error(`Error al leer el archivo ${filename}:`, error);
    return [];
  }
};

const writeJSONFile = (filename, data) => {
  try {
    const filePath = path.join(dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error al escribir en el archivo ${filename}:`, error);
  }
};

/* Ruta Raíz */
app.get('/', (req, res) => {
  res.send('¡Servidor Express con archivos JSON funcionando!');
});

/* Middleware de Autenticación JWT */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Token de verificación fallido:", err.message);
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user;
    next();
  });
};

/* Rutas de Autenticación */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSONFile('users.json');

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const userPayload = { id: user.id, username: user.username, role: user.role };
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login exitoso',
      token: accessToken,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

/* Ruta para Verificar Token */
app.get('/api/verify-token', authenticateToken, (req, res) => {
  res.status(200).json({ message: 'Token válido', user: req.user });
});

/* Rutas de Productos */
app.get('/api/products', authenticateToken, (req, res) => {
  const products = readJSONFile('products.json');
  res.status(200).json(products);
});

app.get('/api/products/:id', authenticateToken, (req, res) => {
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

app.post('/api/products', authenticateToken, (req, res) => {
  const products = readJSONFile('products.json');
  const categories = readJSONFile('categories.json'); // Leer categorías para validación
  const newProductData = req.body;

  // Validar que la categoryId exista
  if (!newProductData.categoryId || !categories.some(c => c.id === newProductData.categoryId)) {
    return res.status(400).json({ message: 'ID de categoría inválido o no proporcionado.' });
  }

  const newId = `prod${products.length > 0 ? Math.max(...products.map(p => parseInt(p.id.replace('prod', '')))) + 1 : 1}`;
  const newProduct = {
    id: newId,
    ...newProductData
  };
  products.push(newProduct);
  writeJSONFile('products.json', products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  let products = readJSONFile('products.json');
  const categories = readJSONFile('categories.json'); // Leer categorías para validación
  const productId = req.params.id;
  const updatedProductData = req.body;

  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex !== -1) {
    // Validar que la categoryId exista si se proporciona
    if (updatedProductData.categoryId && !categories.some(c => c.id === updatedProductData.categoryId)) {
      return res.status(400).json({ message: 'ID de categoría inválido.' });
    }
    products[productIndex] = { ...products[productIndex], ...updatedProductData };
    writeJSONFile('products.json', products);
    res.status(200).json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Producto no encontrado para actualizar' });
  }
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  let products = readJSONFile('products.json');
  const initialLength = products.length;
  products = products.filter(p => p.id !== req.params.id);

  if (products.length < initialLength) {
    writeJSONFile('products.json', products);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Producto no encontrado para eliminar' });
  }
});

/* Rutas de Clientes */
app.get('/api/clients', authenticateToken, (req, res) => {
  const clients = readJSONFile('clients.json');
  res.status(200).json(clients);
});

app.get('/api/clients/:id', authenticateToken, (req, res) => {
  const clients = readJSONFile('clients.json');
  const client = clients.find(c => c.id === req.params.id);
  if (client) {
    res.status(200).json(client);
  } else {
    res.status(404).json({ message: 'Cliente no encontrado' });
  }
});

app.post('/api/clients', authenticateToken, (req, res) => {
  const clients = readJSONFile('clients.json');
  const newClientData = req.body;
  const newId = `cli${clients.length > 0 ? Math.max(...clients.map(c => parseInt(c.id.replace('cli', '')))) + 1 : 1}`;
  const newClient = {
    id: newId,
    ...newClientData
  };
  clients.push(newClient);
  writeJSONFile('clients.json', clients);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
  let clients = readJSONFile('clients.json');
  const clientId = req.params.id;
  const updatedClientData = req.body;

  const clientIndex = clients.findIndex(c => c.id === clientId);

  if (clientIndex !== -1) {
    clients[clientIndex] = { ...clients[clientIndex], ...updatedClientData };
    writeJSONFile('clients.json', clients);
    res.status(200).json(clients[clientIndex]);
  } else {
    res.status(404).json({ message: 'Cliente no encontrado para actualizar' });
  }
});

app.delete('/api/clients/:id', authenticateToken, (req, res) => {
  let clients = readJSONFile('clients.json');
  const initialLength = clients.length;
  clients = clients.filter(c => c.id !== req.params.id);

  if (clients.length < initialLength) {
    writeJSONFile('clients.json', clients);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Cliente no encontrado para eliminar' });
  }
});

/* Rutas de Proveedores */
app.get('/api/providers', authenticateToken, (req, res) => {
  const providers = readJSONFile('providers.json');
  res.status(200).json(providers);
});

app.get('/api/providers/:id', authenticateToken, (req, res) => {
  const providers = readJSONFile('providers.json');
  const provider = providers.find(p => p.id === req.params.id);
  if (provider) {
    res.status(200).json(provider);
  } else {
    res.status(404).json({ message: 'Proveedor no encontrado' });
  }
});

app.post('/api/providers', authenticateToken, (req, res) => {
  const providers = readJSONFile('providers.json');
  const newProviderData = req.body;
  const newId = `prov${providers.length > 0 ? Math.max(...providers.map(p => parseInt(p.id.replace('prov', '')))) + 1 : 1}`;
  const newProvider = {
    id: newId,
    ...newProviderData
  };
  providers.push(newProvider);
  writeJSONFile('providers.json', providers);
  res.status(201).json(newProvider);
});

app.put('/api/providers/:id', authenticateToken, (req, res) => {
  let providers = readJSONFile('providers.json');
  const providerId = req.params.id;
  const updatedProviderData = req.body;

  const providerIndex = providers.findIndex(p => p.id === providerId);

  if (providerIndex !== -1) {
    providers[providerIndex] = { ...providers[providerIndex], ...updatedProviderData };
    writeJSONFile('providers.json', providers);
    res.status(200).json(providers[providerIndex]);
  } else {
    res.status(404).json({ message: 'Proveedor no encontrado para actualizar' });
  }
});

app.delete('/api/providers/:id', authenticateToken, (req, res) => {
  let providers = readJSONFile('providers.json');
  const initialLength = providers.length;
  providers = providers.filter(p => p.id !== req.params.id);

  if (providers.length < initialLength) {
    writeJSONFile('providers.json', providers);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Proveedor no encontrado para eliminar' });
  }
});

/* Rutas de Ventas */
app.get('/api/sales', authenticateToken, (req, res) => {
  const sales = readJSONFile('sales.json');
  res.status(200).json(sales);
});

app.post('/api/sales', authenticateToken, (req, res) => {
  let sales = readJSONFile('sales.json');
  let products = readJSONFile('products.json');
  const newSaleData = req.body;

  if (!newSaleData.clientId || !newSaleData.items || newSaleData.items.length === 0) {
    return res.status(400).json({ message: 'Datos de venta incompletos.' });
  }

  let totalSale = 0;
  const itemsSold = [];
  const errors = [];

  for (const item of newSaleData.items) {
    const productIndex = products.findIndex(p => p.id === item.productId);

    if (productIndex === -1) {
      errors.push(`Producto con ID ${item.productId} no encontrado.`);
      continue;
    }

    const product = products[productIndex];

    if (product.stock < item.quantity) {
      errors.push(`Stock insuficiente para el producto ${product.name} (ID: ${product.id}). Disponible: ${product.stock}, Solicitado: ${item.quantity}`);
      continue;
    }

    product.stock -= item.quantity;
    totalSale += product.price * item.quantity;

    itemsSold.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      price: product.price
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Errores en la venta:', details: errors });
  }

  const newId = `sale${sales.length > 0 ? Math.max(...sales.map(s => parseInt(s.id.replace('sale', '')))) + 1 : 1}`;
  const newSale = {
    id: newId,
    date: new Date().toISOString(),
    clientId: newSaleData.clientId,
    items: itemsSold,
    total: parseFloat(totalSale.toFixed(2))
  };

  sales.push(newSale);
  writeJSONFile('sales.json', sales);
  writeJSONFile('products.json', products);

  res.status(201).json(newSale);
});

/* Rutas de Gestión de Usuarios */
app.get('/api/users_management', authenticateToken, (req, res) => {
  const users = readJSONFile('users.json');
  res.status(200).json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

app.get('/api/users_management/:id', authenticateToken, (req, res) => {
  const users = readJSONFile('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.status(200).json({ id: user.id, username: user.username, role: user.role });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

app.post('/api/users_management', authenticateToken, (req, res) => {
  const users = readJSONFile('users.json');
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Usuario, contraseña y rol son obligatorios.' });
  }
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ message: 'El nombre de usuario ya existe.' });
  }

  const newId = `user${users.length > 0 ? Math.max(...users.map(u => parseInt(u.id.replace('user', '')))) + 1 : 1}`;
  const newUser = {
    id: newId,
    username,
    password,
    role
  };
  users.push(newUser);
  writeJSONFile('users.json', users);
  res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role });
});

app.put('/api/users_management/:id', authenticateToken, (req, res) => {
  let users = readJSONFile('users.json');
  const userId = req.params.id;
  const { username, password, role } = req.body;

  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    if (username && users.some((u, i) => u.username === username && i !== userIndex)) {
      return res.status(400).json({ message: 'El nombre de usuario ya existe para otro usuario.' });
    }

    if (username) users[userIndex].username = username;
    if (password) users[userIndex].password = password;
    if (role) users[userIndex].role = role;

    writeJSONFile('users.json', users);
    res.status(200).json({ id: users[userIndex].id, username: users[userIndex].username, role: users[userIndex].role });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
  }
});

app.delete('/api/users_management/:id', authenticateToken, (req, res) => {
  let users = readJSONFile('users.json');
  const userId = req.params.id;

  if (userId === 'user1') {
    return res.status(403).json({ message: 'No se puede eliminar el usuario administrador principal.' });
  }

  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);

  if (users.length < initialLength) {
    writeJSONFile('users.json', users);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Usuario no encontrado para eliminar' });
  }
});

/* Rutas para Categorías */
app.get('/api/categories', authenticateToken, (req, res) => {
  const categories = readJSONFile('categories.json');
  res.status(200).json(categories);
});

app.get('/api/categories/:id', authenticateToken, (req, res) => {
  const categories = readJSONFile('categories.json');
  const category = categories.find(c => c.id === req.params.id);
  if (category) {
    res.status(200).json(category);
  } else {
    res.status(404).json({ message: 'Categoría no encontrada' });
  }
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const categories = readJSONFile('categories.json');
  const newCategoryData = req.body;

  if (!newCategoryData.name) {
    return res.status(400).json({ message: 'El nombre de la categoría es obligatorio.' });
  }
  if (categories.some(c => c.name.toLowerCase() === newCategoryData.name.toLowerCase())) {
    return res.status(400).json({ message: 'Ya existe una categoría con ese nombre.' });
  }

  const newId = `cat${categories.length > 0 ? Math.max(...categories.map(c => parseInt(c.id.replace('cat', '')))) + 1 : 1}`;
  const newCategory = {
    id: newId,
    ...newCategoryData
  };
  categories.push(newCategory);
  writeJSONFile('categories.json', categories);
  res.status(201).json(newCategory);
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  let categories = readJSONFile('categories.json');
  const categoryId = req.params.id;
  const updatedCategoryData = req.body;

  const categoryIndex = categories.findIndex(c => c.id === categoryId);

  if (categoryIndex !== -1) {
    if (updatedCategoryData.name && categories.some((c, i) => c.name.toLowerCase() === updatedCategoryData.name.toLowerCase() && i !== categoryIndex)) {
      return res.status(400).json({ message: 'Ya existe otra categoría con ese nombre.' });
    }
    categories[categoryIndex] = { ...categories[categoryIndex], ...updatedCategoryData };
    writeJSONFile('categories.json', categories);
    res.status(200).json(categories[categoryIndex]);
  } else {
    res.status(404).json({ message: 'Categoría no encontrada para actualizar' });
  }
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  let categories = readJSONFile('categories.json');
  const categoryId = req.params.id;

  // Verificar si hay productos asociados a esta categoría antes de eliminar
  const products = readJSONFile('products.json');
  const productsInCategory = products.filter(p => p.categoryId === categoryId); // Usar categoryId aquí
  if (productsInCategory.length > 0) {
    return res.status(400).json({ message: 'No se puede eliminar la categoría porque tiene productos asociados.' });
  }

  const initialLength = categories.length;
  categories = categories.filter(c => c.id !== categoryId);

  if (categories.length < initialLength) {
    writeJSONFile('categories.json', categories);
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Categoría no encontrada para eliminar' });
  }
});

/* Inicio del Servidor */
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});