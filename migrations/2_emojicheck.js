var EmojiCheck = artifacts.require("./util/EmojiCheck.sol")

module.exports = function(deployer) {
    deployer.deploy(EmojiCheck)
        .then(() => EmojiCheck.deployed())
        .then((instance) => {
            instance.addEmojiRange(0x203C, 0x203C) 
            instance.addEmojiRange(0x2049, 0x2049)
            instance.addEmojiRange(0x2122, 0x2122)
            instance.addEmojiRange(0x2139, 0x2139)
            instance.addEmojiRange(0x2194, 0x2199)
            instance.addEmojiRange(0x21A9, 0x21AA)

            instance.addEmojiRange(0x231A, 0x231B)
            instance.addEmojiRange(0x2328, 0x2328)
            instance.addEmojiRange(0x23CF, 0x23CF)
            instance.addEmojiRange(0x23E9, 0x23F3)
            instance.addEmojiRange(0x23F8, 0x23FA)
            instance.addEmojiRange(0x24C2, 0x24C2)

            instance.addEmojiRange(0x25AA, 0x25AB)
            instance.addEmojiRange(0x25B6, 0x25B6)
            instance.addEmojiRange(0x25C0, 0x25C0)
            instance.addEmojiRange(0x25FB, 0x25FE)
            instance.addEmojiRange(0x2600, 0x2604)
            instance.addEmojiRange(0x260E, 0x260E)

            instance.addEmojiRange(0x2611, 0x2611)
            instance.addEmojiRange(0x2614, 0x2615)
            instance.addEmojiRange(0x2618, 0x2618)
            instance.addEmojiRange(0x261D, 0x261D)
            instance.addEmojiRange(0x2620, 0x2620)
            instance.addEmojiRange(0x2622, 0x2623)

            instance.addEmojiRange(0x2626, 0x2626)
            instance.addEmojiRange(0x262A, 0x262A)
            instance.addEmojiRange(0x262E, 0x262F)
            instance.addEmojiRange(0x2638, 0x263A)
            instance.addEmojiRange(0x2640, 0x2640)
            instance.addEmojiRange(0x2642, 0x2642)

            instance.addEmojiRange(0x2648, 0x2653)
            instance.addEmojiRange(0x2660, 0x2660)
            instance.addEmojiRange(0x2663, 0x2663)
            instance.addEmojiRange(0x2665, 0x2666)
            instance.addEmojiRange(0x2668, 0x2668)
            instance.addEmojiRange(0x267B, 0x267B)

            instance.addEmojiRange(0x267F, 0x267F)
            instance.addEmojiRange(0x2692, 0x2697)
            instance.addEmojiRange(0x2699, 0x2699)
            instance.addEmojiRange(0x269B, 0x269C)
            instance.addEmojiRange(0x26A0, 0x26A1)
            instance.addEmojiRange(0x26AA, 0x26AB)

            instance.addEmojiRange(0x26B0, 0x26B1)
            instance.addEmojiRange(0x26BD, 0x26BE)
            instance.addEmojiRange(0x26C4, 0x26C5)
            instance.addEmojiRange(0x26C8, 0x26C8)
            instance.addEmojiRange(0x26CE, 0x26CE)
            instance.addEmojiRange(0x26CF, 0x26CF)

            instance.addEmojiRange(0x26D1, 0x26D1)
            instance.addEmojiRange(0x26D3, 0x26D4)
            instance.addEmojiRange(0x26E9, 0x26EA)
            instance.addEmojiRange(0x26F0, 0x26F5)
            instance.addEmojiRange(0x26F7, 0x26FA)
            instance.addEmojiRange(0x26FD, 0x26FD)

            instance.addEmojiRange(0x2702, 0x2702)
            instance.addEmojiRange(0x2705, 0x2705)
            instance.addEmojiRange(0x2708, 0x2709)
            instance.addEmojiRange(0x270A, 0x270B)
            instance.addEmojiRange(0x270C, 0x270D)
            instance.addEmojiRange(0x270F, 0x270F)

            instance.addEmojiRange(0x2712, 0x2712)
            instance.addEmojiRange(0x2714, 0x2714)
            instance.addEmojiRange(0x2716, 0x2716)
            instance.addEmojiRange(0x271D, 0x271D)
            instance.addEmojiRange(0x2721, 0x2721)
            instance.addEmojiRange(0x2728, 0x2728)

            instance.addEmojiRange(0x2733, 0x2734)
            instance.addEmojiRange(0x2744, 0x2744)
            instance.addEmojiRange(0x2747, 0x2747)
            instance.addEmojiRange(0x274C, 0x274C)
            instance.addEmojiRange(0x274E, 0x274E)
            instance.addEmojiRange(0x2753, 0x2755)

            instance.addEmojiRange(0x2757, 0x2757)
            instance.addEmojiRange(0x2763, 0x2764)
            instance.addEmojiRange(0x2795, 0x2797)
            instance.addEmojiRange(0x27A1, 0x27A1)
            instance.addEmojiRange(0x27B0, 0x27B0)
            instance.addEmojiRange(0x27BF, 0x27BF)

            instance.addEmojiRange(0x2934, 0x2935)
            instance.addEmojiRange(0x2B05, 0x2B07)
            instance.addEmojiRange(0x2B1B, 0x2B1C)
            instance.addEmojiRange(0x2B50, 0x2B50)
            instance.addEmojiRange(0x2B55, 0x2B55)
            instance.addEmojiRange(0x3030, 0x3030)

            instance.addEmojiRange(0x303D, 0x303D)
            instance.addEmojiRange(0x3297, 0x3297)
            instance.addEmojiRange(0x3299, 0x3299)
        })

  }


    