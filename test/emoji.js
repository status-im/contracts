
var EmojiCheck = artifacts.require("./util/EmojiCheck.sol")

contract('EmojiCheck', function(accounts) {

    let contractInstance;

    before(async () => {
        contractInstance = await EmojiCheck.deployed();
    })


    
    describe("isInEmojiRange(uint32 _char, uint256 _rangePos)", () => {

        it("Character is in simple range", async () => {
            let character;
            let range = 0; // According to migration script, instance.addEmojiRange(0x203C, 0x203C)
            // Min Limit
            character = '0x203C';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                true,
                "Character " + character +" should exist in range: " + range)
        });


        it("Character is in extended range", async () => {
            let character;
            let range = 9; // According to migration script, instance.addEmojiRange(0x23E9, 0x23F3)
            
            // Min Limit
            character = '0x23E9';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                true,
                "Character " + character +" should exist in range: " + range)

            // In range
            character = '0x23F0';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                true,
                "Character " + character +" should exist in range: " + range)

            // Max Limit
            character = '0x23F3';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                true,
                "Character " + character +" should exist in range: " + range)
        });

        it("Character is not in simple range", async () => {
            let character;
            let range = 0; // According to migration script, instance.addEmojiRange(0x203C, 0x203C)
            // Min Limit
            character = '0xF0F0';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                false,
                "Character " + character +" should not exist in range: " + range)
        });

        it("Character is not in extended range", async () => {
            let character;
            let range = 9; // According to migration script, instance.addEmojiRange(0x23E9, 0x23F3)
            
            // Below Min Limit
            character = '0x23E8';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                false,
                "Character " + character +" should not exist in range: " + range)

            // Above Max Limit
            character = '0x23F4';
            assert.equal(
                await contractInstance.isInEmojiRange(character, range),
                false,
                "Character " + character +" should not exist in range: " + range)
        });
    });


    describe("isEmojiOnly(uint32[] _s, uint256[] _rangePos)", () => {
        it("All characters are emoji", async () => {
            let characterArray = [
                '0x203C',
                '0x2049',
                '0x2122',
            ];

            let rangeArray = [0, 1, 2];

            assert.equal(
                await contractInstance.isEmojiOnly(characterArray, rangeArray),
                true,
                "All characters are supposed to be emoji and in the selected ranges");
        });

        it("Some characters are emoji", async () => {
            let characterArray = [
                '0x203C',
                '0x0001',
                '0x2122',
            ];

            let rangeArray = [0, 1, 2];

            assert.equal(
                await contractInstance.isEmojiOnly(characterArray, rangeArray),
                false,
                "Function isEmojiOnly is supposed to return false when some characters are emoji");
        });

        it("No characters are emoji", async () => {
            let characterArray = [
                '0x0001',
                '0x0002',
                '0x0003',
            ];

            let rangeArray = [0, 1, 2];

            assert.equal(
                await contractInstance.isEmojiOnly(characterArray, rangeArray),
                false,
                "Function isEmojiOnly is supposed to return false when none of the characters are emoji");
        });

        it("All characters are emoji and includes a extended range", async () => {
            let characterArray = [
                '0x203C',
                '0x2049',
                '0x23EA'
            ];

            let rangeArray = [0, 1, 9];

            assert.equal(
                await contractInstance.isEmojiOnly(characterArray, rangeArray),
                true,
                "All characters are supposed to be emoji and in the selected ranges");
        });
    });


    describe("isEmoji(uint32 _s)", () => {
        it("Characters are emoji", async () => {
            let character = '0x203C';
            assert.equal(
                await contractInstance.isEmoji(character),
                true,
                "Character " + character + " should be emoji");

            character = '0x23EA';
            assert.equal(
                await contractInstance.isEmoji(character),
                true,
                "Character " + character + " should be emoji");
        });

        it("Character is not an emoji", async () => {
            let character = '0x0001';
            assert.equal(
                await contractInstance.isEmoji(character),
                false,
                "Character " + character + " should not be emoji");
        });
    });


    describe("isCharArrayEmojiOnly(uint32[] _s)", () => {
        it("All characters are emoji", async () => {
            let characterArray = [
                '0x203C',
                '0x2049',
                '0x2122',
            ];

            assert.equal(
                await contractInstance.isCharArrayEmojiOnly(characterArray),
                true,
                "All characters are supposed to be emoji");
        });

        it("Some characters are emoji", async () => {
            let characterArray = [
                '0x203C',
                '0x0001',
                '0x2122',
            ];

            assert.equal(
                await contractInstance.isCharArrayEmojiOnly(characterArray),
                false,
                "Function isCharArrayEmojiOnly is supposed to return false when some characters are emoji");
        });

        it("No characters are emoji", async () => {
            let characterArray = [
                '0x0001',
                '0x0002',
                '0x0003',
            ];

            assert.equal(
                await contractInstance.isCharArrayEmojiOnly(characterArray),
                false,
                "Function isCharArrayEmojiOnly is supposed to return false when none of the characters are emoji");
        });
    });

});