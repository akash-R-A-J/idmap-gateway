/**
 * --------------------------------------------------------------------
 * Express Type Augmentation
 * --------------------------------------------------------------------
 * This module extends the Express `Request` interface to include
 * a `userId` property. This property is typically added by
 * authentication middleware after verifying a user's token/session.
 * 
 * Example:
 *   req.userId = decodedToken.userId;
 * --------------------------------------------------------------------
 */

import "express";

declare module "express-serve-static-core" {
  interface Request {
    /** The authenticated user's unique ID */
    userId?: string;
  }
}
