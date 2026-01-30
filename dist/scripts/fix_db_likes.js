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
const addLikedByColumn = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.authenticate();
        // console.log('Database connected.');
        try {
            // Add likedBy column (JSON)
            // In SQLite, JSON is just TEXT
            yield database_1.default.query('ALTER TABLE blogs ADD COLUMN likedBy TEXT DEFAULT "[]";');
            // console.log('Successfully added "likedBy" column to "blogs" table.');
        }
        catch (error) {
            if (error.message && error.message.includes('duplicate column name')) {
                // console.log('"likedBy" column already exists.');
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
addLikedByColumn();
