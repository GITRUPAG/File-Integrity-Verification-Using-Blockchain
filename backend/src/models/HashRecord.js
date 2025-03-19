import mongoose from "mongoose";

const hashRecordSchema = new mongoose.Schema({
  hash: { type: String, required: true },
  owner: { type: String, required: true },
  tokenId: { type: String, required: true },
});

const HashRecord = mongoose.model("HashRecord", hashRecordSchema);
export default HashRecord;
