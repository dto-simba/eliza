import express from "express";
import {elizaLogger} from "@elizaos/core";

export function creatPredictRouter() {
    const router = express.Router();

    router.get("/test", (req, res) => {
        elizaLogger.log("This is route from predictRouter");
        res.send("This is route from predictRouter");
    });

    return router;
}
