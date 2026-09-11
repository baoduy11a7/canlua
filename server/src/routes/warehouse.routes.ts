import { Router } from 'express';
import {
  getWarehouseTransactions,
  createWarehouseTransaction,
  getInventory,
  updateInventoryWarning,
} from '../controllers/warehouse.controller';
import {
  getWarehouseLocations,
  createWarehouseLocation,
  updateWarehouseLocation,
  deleteWarehouseLocation,
} from '../controllers/warehouseLocation.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Warehouse Locations (Danh sách các kho lúa)
router.get('/locations', getWarehouseLocations);
router.post('/locations', createWarehouseLocation);
router.put('/locations/:id', updateWarehouseLocation);
router.delete('/locations/:id', deleteWarehouseLocation);

// Warehouse Transactions & Inventory
router.get('/transactions', getWarehouseTransactions);
router.post('/transactions', createWarehouseTransaction);
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateInventoryWarning);

export default router;
