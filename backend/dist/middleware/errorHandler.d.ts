import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map