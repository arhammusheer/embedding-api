import { NextFunction, Request, Response } from "express";
import StorageService from "../services/gcs.service";
import { BUCKET_NAME } from "../config";

const filesController = {
  async getFileByPath(req: Request, res: Response, next: NextFunction) {
    try {
      const gcs = new StorageService(BUCKET_NAME);
      const file = await gcs.getFileByPath(req.params['0']);
			// mm-dd-yyyy
			const expires1hr = new Date();
			expires1hr.setHours(expires1hr.getHours() + 1);
			
			await file.makePublic();

			const url = await file.publicUrl();

			
      res.status(200).send(url)
    } catch (error) {
      next(error);
    }
  },
};

export default filesController;
