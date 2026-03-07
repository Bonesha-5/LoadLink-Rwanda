const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const companyRoute=require('./routes/companyLogin');
app.use('/api/auth/company', companyRoute);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LoadLink server running on port ${PORT}`));
