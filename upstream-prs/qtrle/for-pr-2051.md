For storytold/effectcraft#2051 (QuickTime Animation decoder). Suggested as a comment to its author, with the patch attached or as a branch they can pull.

Fork branch: geterothis:fix/qtrle-pr2051-on-main. Commit 7c1d7bfa on top of #2051 rebased onto main (f1b12414). Patch: qtrle-chunk-size.patch.

Comment draft:

> Thanks for the decoder. Movies written by After Effects 2026 decode wrong with it: frames freeze or come out garbled. Each sample's 4-byte chunk size has 0x40 set in its top byte. `size & 0x3FFFFFFF` equals the sample size on every frame we checked. `chunk_body` compares the unmasked size with the sample length, so it doesn't strip the prefix and reads the size bytes as the header. When the 0x0008 bit happens to be set there, the start line is past the frame and nothing is painted, so the frame freezes. Otherwise the lines are garbage.
>
> The commit masks the top two bits, reads a sample that is longer than its chunk up to the chunk's size, and treats a chunk under 8 bytes as "no change". Three new unit tests cover this; the flag-bit one fails without the change. We also checked a 100-frame 32-bit long-GOP sample against ffmpeg, seeking in and out of order: max difference 1/255.
