import AVFoundation
import Foundation

// usage: av_say <voiceIdentifier> <outPath> <text>
let args = CommandLine.arguments
guard args.count >= 4 else {
    FileHandle.standardError.write("usage: av_say <voiceIdentifier> <outPath> <text>\n".data(using: .utf8)!)
    exit(1)
}
let voiceId = args[1]
let outPath = args[2]
let text = args[3]

guard let voice = AVSpeechSynthesisVoice(identifier: voiceId) else {
    FileHandle.standardError.write("voice not found: \(voiceId)\n".data(using: .utf8)!)
    exit(1)
}

let utterance = AVSpeechUtterance(string: text)
utterance.voice = voice

let synthesizer = AVSpeechSynthesizer()
var audioFile: AVAudioFile?
var failed = false
var done = false

synthesizer.write(utterance) { (buffer: AVAudioBuffer) in
    guard let pcmBuffer = buffer as? AVAudioPCMBuffer else {
        failed = true
        done = true
        return
    }
    if pcmBuffer.frameLength == 0 {
        // end of utterance
        done = true
        return
    }
    if audioFile == nil {
        let settings = pcmBuffer.format.settings
        do {
            audioFile = try AVAudioFile(forWriting: URL(fileURLWithPath: outPath), settings: settings)
        } catch {
            FileHandle.standardError.write("failed to create audio file: \(error)\n".data(using: .utf8)!)
            failed = true
            done = true
            return
        }
    }
    do {
        try audioFile?.write(from: pcmBuffer)
    } catch {
        FileHandle.standardError.write("write error: \(error)\n".data(using: .utf8)!)
        failed = true
    }
}

let deadline = Date().addingTimeInterval(30)
while !done && Date() < deadline {
    RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
if !done {
    FileHandle.standardError.write("timeout\n".data(using: .utf8)!)
    exit(1)
}
exit(failed ? 1 : 0)
