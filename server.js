// Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));
app.use(express.json());

const dataPath = path.join(__dirname, 'data');

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

app.get('/', (req, res) => {
  res.send('¡Servidor Express con archivos JSON funcionando!');
});

// --- Autenticación (Login) - AHORA USA EL ÚNICO users.json ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSONFile('users.json'); // Lee del único users.json

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Al login exitoso, devolvemos el ID, username Y EL ROL del usuario
    res.status(200).json({ message: 'Login exitoso', user: { id: user.id, username: user.username, role: user.role } });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

// --- Rutas de Productos (sin cambios) ---
app.get('/api/products', (req, res) => {
  const products = readJSONFile('products.json');
  res.status(200).json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = readJSONFile('products.json');
  const product = products.find(p => p.id === req.params.id);
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

app.post('/api/products', (req, res) => {
  const products = readJSONFile('products.json');
  const newProductData = req.body;
  const newId = `prod${products.length > 0 ? Math.max(...products.map(p => parseInt(p.id.replace('prod', '')))) + 1 : 1}`;
  const newProduct = {
    id: newId,
    ...newProductData
  };
  products.push(newProduct);
  writeJSONFile('products.json', products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  let products = readJSONFile('products.json');
  const productId = req.params.id;
  const updatedProductData = req.body;

  const productIndex = products.findIndex(p => p.id === productId);

  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...updatedProductData };
    writeJSONFile('products.json', products);
    res.status(200).json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Producto no encontrado para actualizar' });
  }
});

app.delete('/api/products/:id', (req, res) => {
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

// --- Rutas de Clientes (sin cambios) ---
app.get('/api/clients', (req, res) => {
  const clients = readJSONFile('clients.json');
  res.status(200).json(clients);
});

app.get('/api/clients/:id', (req, res) => {
  const clients = readJSONFile('clients.json');
  const client = clients.find(c => c.id === req.params.id);
  if (client) {
    res.status(200).json(client);
  } else {
    res.status(404).json({ message: 'Cliente no encontrado' });
  }
});

app.post('/api/clients', (req, res) => {
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

app.put('/api/clients/:id', (req, res) => {
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

app.delete('/api/clients/:id', (req, res) => {
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

// --- Rutas de Proveedores (sin cambios) ---
app.get('/api/providers', (req, res) => {
  const providers = readJSONFile('providers.json');
  res.status(200).json(providers);
});

app.get('/api/providers/:id', (req, res) => {
  const providers = readJSONFile('providers.json');
  const provider = providers.find(p => p.id === req.params.id);
  if (provider) {
    res.status(200).json(provider);
  } else {
    res.status(404).json({ message: 'Proveedor no encontrado' });
  }
});

app.post('/api/providers', (req, res) => {
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

app.put('/api/providers/:id', (req, res) => {
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

app.delete('/api/providers/:id', (req, res) => {
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

// --- Rutas de Ventas (sin cambios) ---
app.get('/api/sales', (req, res) => {
  const sales = readJSONFile('sales.json');
  res.status(200).json(sales);
});

app.post('/api/sales', (req, res) => {
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

// --- Rutas de Gestión de Usuarios (AHORA USAN EL ÚNICO users.json) ---

// Obtener todos los usuarios
app.get('/api/users_management', (req, res) => {
  const users = readJSONFile('users.json'); // Lee del único users.json
  res.status(200).json(users.map(u => ({ id: u.id, username: u.username, role: u.role })));
});

// Obtener un usuario por ID
app.get('/api/users_management/:id', (req, res) => {
  const users = readJSONFile('users.json'); // Lee del único users.json
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    res.status(200).json({ id: user.id, username: user.username, role: user.role });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado' });
  }
});

// Crear un nuevo usuario
app.post('/api/users_management', (req, res) => {
  const users = readJSONFile('users.json'); // Lee del único users.json
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
  writeJSONFile('users.json', users); // Escribe en el único users.json
  res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role });
});

// Actualizar un usuario
app.put('/api/users_management/:id', (req, res) => {
  let users = readJSONFile('users.json'); // Lee del único users.json
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

    writeJSONFile('users.json', users); // Escribe en el único users.json
    res.status(200).json({ id: users[userIndex].id, username: users[userIndex].username, role: users[userIndex].role });
  } else {
    res.status(404).json({ message: 'Usuario no encontrado para actualizar' });
  }
});

// Eliminar un usuario
app.delete('/api/users_management/:id', (req, res) => {
  let users = readJSONFile('users.json'); // Lee del único users.json
  const userId = req.params.id;

  // Opcional: No permitir eliminar al usuario 'admin' (si su id es 'user1')
  if (userId === 'user1') { // Asumiendo que 'user1' es tu admin principal
    return res.status(403).json({ message: 'No se puede eliminar el usuario administrador principal.' });
  }

  const initialLength = users.length;
  users = users.filter(u => u.id !== userId);

  if (users.length < initialLength) {
    writeJSONFile('users.json', users); // Escribe en el único users.json
    res.status(204).send();
  } else {
    res.status(404).json({ message: 'Usuario no encontrado para eliminar' });
  }
});

// --- Iniciar el servidor ---
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});