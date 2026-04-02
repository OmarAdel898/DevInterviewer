import {Router} from 'express';
import {runCode} from '../controllers/compiler.controller.js'; 
import {protect} from '../middlewares/auth.middleware.js';

const route = Router();

route.post('/run', protect, runCode);

export default route;