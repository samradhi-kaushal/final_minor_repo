from pymongo import MongoClient
import gridfs
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "filesDB")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
fs = gridfs.GridFS(db)
