async function main() {
    const ImageHashStorage = await ethers.getContractFactory("ImageHashStorage");
    const imageHashStorage = await ImageHashStorage.deploy();

    // Wait for the contract to be deployed
    await imageHashStorage.waitForDeployment();

    // Get the deployed contract address
    const contractAddress = await imageHashStorage.getAddress();
    console.log("Contract deployed to:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
