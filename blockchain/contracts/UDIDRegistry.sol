// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UDIDRegistry {
    // Mapping from Aadhaar number to UDID
    mapping(string => string) private aadharToUDID;
    // Mapping to check if a UDID has already been registered
    mapping(string => bool) private udidExists;
    
    // Authorized government address (simple version: the deployer)
    address public governmentAgency;

    event UDIDRegistered(string indexed aadhar, string indexed udid, address indexed authorizedBy);

    constructor() {
        governmentAgency = msg.sender;
    }

    modifier onlyGovernment() {
        require(msg.sender == governmentAgency, "Only government agency can register UDIDs");
        _;
    }

    /**
     * @dev Registers a UDID for a given Aadhaar. 
     * Ensures one Aadhaar has only one UDID and UDID is unique.
     */
    function registerUDID(string memory aadhar, string memory udid) public onlyGovernment {
        require(bytes(aadhar).length > 0, "Aadhaar cannot be empty");
        require(bytes(udid).length > 0, "UDID cannot be empty");
        require(bytes(aadharToUDID[aadhar]).length == 0, "Aadhaar already has a UDID registered");
        require(!udidExists[udid], "UDID already registered");

        aadharToUDID[aadhar] = udid;
        udidExists[udid] = true;

        emit UDIDRegistered(aadhar, udid, msg.sender);
    }

    /**
     * @dev Retrieves the UDID associated with an Aadhaar.
     */
    function getUDID(string memory aadhar) public view returns (string memory) {
        return aadharToUDID[aadhar];
    }
    
    /**
     * @dev Checks if a UDID exists.
     */
    function isUDIDRegistered(string memory udid) public view returns (bool) {
        return udidExists[udid];
    }
}
