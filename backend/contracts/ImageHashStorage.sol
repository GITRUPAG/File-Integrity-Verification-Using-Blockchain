// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageHashStorage {
    mapping(uint256 => bytes32) public imageHashes;  // Mapping from hash ID to hash value
    mapping(bytes32 => uint256) private hashToId;   // Reverse mapping from hash to ID
    mapping(bytes32 => bool) private hashExists;    // ✅ Track stored hashes
    mapping(address => uint256[]) private userHashes; // ✅ Track hashes per user
    mapping(uint256 => bytes32) private blockHashStorage; // ✅ Track hash by block number
    uint256 public hashCount = 0;                  // Counter for hash IDs
    mapping(uint256 => bytes32) public blockHashes; // Stores hashes by block number

    event HashStored(uint256 indexed hashId, bytes32 hash, address indexed sender, uint256 blockNumber);

    /**
     * @dev Stores an image hash on the blockchain.
     * @param _hash The hash of the image (SHA-256 in hex string format).
     * @return The hash ID assigned to the stored hash.
     */
    function storeImageHash(bytes32 _hash) public returns (uint256) {
        require(!hashExists[_hash], "Hash already stored");

        uint256 currentId = ++hashCount;
        imageHashes[currentId] = _hash;
        hashToId[_hash] = currentId; // ✅ Store mapping of hash to ID
        hashExists[_hash] = true;    // ✅ Mark hash as stored
        userHashes[msg.sender].push(currentId); // ✅ Store hash ID for user
        blockHashes[block.number] = _hash; // Store hash by block number

        emit HashStored(currentId, _hash, msg.sender, block.number);
        return currentId;
    }

    /**
     * @dev Retrieves an image hash by its unique ID.
     * @param _id The hash ID.
     * @return The stored image hash.
     */
    function getImageHash(uint256 _id) public view returns (bytes32) {
        require(_id > 0 && _id <= hashCount, "Invalid hash ID");
        return imageHashes[_id];
    }

    /**
     * @dev Retrieves the hash ID using a hash value.
     * @param _hash The hash value of an image.
     * @return The unique hash ID assigned to this hash (or 0 if not found).
     */
    function getImageHashFromBlockchain(bytes32 _hash) public view returns (uint256) {
        return hashToId[_hash];  // ✅ Returns 0 if hash is not found
    }

    function getIdByHash(bytes32 _hash) public view returns (uint256) {
        return hashToId[_hash];  // ✅ Returns 0 if hash is not found
    }

    /**
     * @dev Retrieves the hash ID of an image hash.
     * @param _id The hash ID.
     * @return The hash value associated with the given ID.
     */
    function getImageHashId(uint256 _id) public view returns (bytes32) {
        require(_id > 0 && _id <= hashCount, "Invalid hash ID");
        return imageHashes[_id]; // ✅ Returns hash value
    }

    /**
     * @dev Retrieves all hash IDs stored by a user.
     * @param _user The address of the user.
     * @return Array of hash IDs stored by the user.
     */
    function getHashesByUser(address _user) public view returns (uint256[] memory) {
        return userHashes[_user];
    }

    /**
     * @dev Retrieves the stored image hash using the block number.
     * @param _blockNumber The block number where the hash was stored.
     * @return The stored image hash for the given block.
     */
    function getHashByBlockNumber(uint256 _blockNumber) public view returns (bytes32) {
        require(blockHashStorage[_blockNumber] != bytes32(0), "No hash stored at this block");
        return blockHashStorage[_blockNumber];
    }

    
}
