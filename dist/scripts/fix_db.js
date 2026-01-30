"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const addLikesColumn = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.authenticate();
        // console.log('Database connected.');
        // Raw SQL to add column if it doesn't exist
        // Note: SQLite does not support IF NOT EXISTS for ADD COLUMN directly in standard SQL, 
        // but it usually errors safely or we catch it.
        // However, duplicate column error is harmless if we catch it.
        try {
            yield database_1.default.query('ALTER TABLE blogs ADD COLUMN likes INTEGER DEFAULT 0;');
            // console.log('Successfully added "likes" column to "blogs" table.');
        }
        catch (error) {
            if (error.message && error.message.includes('duplicate column name')) {
                // console.log('"likes" column already exists.');
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        console.error('Error updating database:', error);
    }
    finally {
        yield database_1.default.close();
    }
});
addLikesColumn();
