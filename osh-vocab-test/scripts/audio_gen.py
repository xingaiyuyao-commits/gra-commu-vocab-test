# -*- coding: utf-8 -*-
"""単語ごとの発音音声を生成する（macOSのsay/AVSpeechSynthesizer）。
英語（単語・例文・連続再生）は男性Evan(Enhanced)のみ。日本語→英語は日本語Kyoko(女性)＋英語Evan(男性)の1本のみ生成する。
FEMALE_VOICEは旧仕様（TOEIC Series01）で使用済みのため参照用に残す。
"""
import os
import re
import subprocess

MALE_VOICE = "Evan (Enhanced)"
FEMALE_VOICE = "Samantha (Enhanced)"  # 旧仕様（TOEIC Series01）で使用。新規生成では不使用。
JAPANESE_VOICE_ID = "com.apple.voice.enhanced.ja-JP.Kyoko"

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "output", "audio")
AV_SAY_BIN = os.path.join(os.path.dirname(__file__), "bin", "av_say")
_ITALIC_RE = re.compile(r"</?i>")


def _safe_filename(word):
    return re.sub(r"[^a-zA-Z0-9]+", "_", word).strip("_").lower()


def _say_with_retry(voice, out_path, text, tries=3, timeout_sec=20):
    """sayコマンドがまれにハングするため、タイムアウト+リトライで頑健化する。"""
    for attempt in range(1, tries + 1):
        try:
            subprocess.run(["say", "-v", voice, "-o", out_path, text], check=True, timeout=timeout_sec)
            return True
        except subprocess.TimeoutExpired:
            print(f"  timeout (試行{attempt}/{tries}): {voice} '{text[:30]}'")
        except subprocess.CalledProcessError as e:
            print(f"  error (試行{attempt}/{tries}): {voice} '{text[:30]}': {e}")
    return False


def _av_say_with_retry(voice_id, out_path, text, tries=3, timeout_sec=30):
    """AVSpeechSynthesizer経由（scripts/bin/av_say）でEnhanced/Premium品質の声を使って読み上げる。
    sayコマンド（NSSpeechSynthesizer）はEnhanced/Premiumボイスを認識せず標準品質にフォールバックしてしまうため。
    """
    caf_tmp = out_path + ".caf"
    for attempt in range(1, tries + 1):
        try:
            subprocess.run([AV_SAY_BIN, voice_id, caf_tmp, text], check=True, timeout=timeout_sec, capture_output=True)
            subprocess.run(["ffmpeg", "-y", "-i", caf_tmp, "-c:a", "aac", out_path],
                            check=True, capture_output=True, timeout=timeout_sec)
            return True
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            print(f"  timeout/error (試行{attempt}/{tries}): av_say {voice_id} '{text[:30]}': {e}")
        finally:
            if os.path.exists(caf_tmp):
                os.remove(caf_tmp)
    return False


def _concat_with_silence(parts, out_path, silence_ms=500, tries=3):
    """複数の音声ファイルを無音を挟んで結合する（異なる声を跨ぐ場合はsayの[[slnc]]が使えないため）。"""
    silence_path = out_path + ".silence.m4a"
    subprocess.run(
        ["ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono:d={silence_ms / 1000}",
         "-c:a", "aac", silence_path],
        check=True, capture_output=True,
    )
    try:
        inputs = []
        for i, p in enumerate(parts):
            inputs += ["-i", p]
            if i < len(parts) - 1:
                inputs += ["-i", silence_path]
        n = len(parts) * 2 - 1
        filter_str = "".join(f"[{i}:a]" for i in range(n)) + f"concat=n={n}:v=0:a=1[out]"
        for attempt in range(1, tries + 1):
            try:
                subprocess.run(
                    ["ffmpeg", "-y", *inputs, "-filter_complex", filter_str, "-map", "[out]", out_path],
                    check=True, capture_output=True, timeout=30,
                )
                return True
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
                print(f"  concat失敗 (試行{attempt}/{tries}): {out_path}: {e}")
    finally:
        if os.path.exists(silence_path):
            os.remove(silence_path)
    return False


def generate_series_audio(series_map, test_name, series_numbers=None, skip_existing=True):
    """series_map: {series_no: {'words': [...]}, ...}
    series_numbers: 生成対象のシリーズ番号リスト（Noneなら全シリーズ）
    skip_existing: 既に生成済みのファイルはスキップ（再実行時の重複生成を防ぐ）
    英語音声は男性のみ生成する（{word}_m.m4a）。
    戻り値: (生成したファイル数, 失敗した(voice, word)のリスト)。
    """
    count = 0
    failures = []
    targets = series_numbers if series_numbers is not None else list(series_map.keys())
    for n in targets:
        d = series_map[n]
        series_dir = os.path.join(AUDIO_DIR, test_name, f"Series{n:02d}" if isinstance(n, int) else f"Series{n}")
        os.makedirs(series_dir, exist_ok=True)
        for w in d["words"]:
            word = w[0]
            fname = _safe_filename(word)
            out_path = os.path.join(series_dir, f"{fname}_m.m4a")
            if skip_existing and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                count += 1
                continue
            ok = _say_with_retry(MALE_VOICE, out_path, word)
            if ok:
                count += 1
            else:
                failures.append((MALE_VOICE, word))
    return count, failures


def generate_jp2en_audio(series_map, test_name, series_numbers=None, skip_existing=True, silence_ms=500):
    """日本語の意味（女性・Kyoko）を読み上げた後、無音を挟んで英単語（男性・Evan）を読み上げる音声
    （{word}_jp2en.m4a）を1本のみ生成する。単語のみの音声が既にあればそれを使い、なければ一時生成して結合する。
    """
    count = 0
    failures = []
    targets = series_numbers if series_numbers is not None else list(series_map.keys())
    for n in targets:
        d = series_map[n]
        series_dir = os.path.join(AUDIO_DIR, test_name, f"Series{n:02d}" if isinstance(n, int) else f"Series{n}")
        os.makedirs(series_dir, exist_ok=True)
        for w in d["words"]:
            word, jp = w[0], w[4]
            fname = _safe_filename(word)
            out_path = os.path.join(series_dir, f"{fname}_jp2en.m4a")
            if skip_existing and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                count += 1
                continue
            jp_tmp = os.path.join(series_dir, f".{fname}_jp_tmp.m4a")
            word_path = os.path.join(series_dir, f"{fname}_m.m4a")
            word_tmp = None
            if not (os.path.exists(word_path) and os.path.getsize(word_path) > 0):
                word_tmp = os.path.join(series_dir, f".{fname}_m_tmp.m4a")
            try:
                ok = _av_say_with_retry(JAPANESE_VOICE_ID, jp_tmp, jp)
                if ok and word_tmp:
                    ok = _say_with_retry(MALE_VOICE, word_tmp, word)
                if ok:
                    ok = _concat_with_silence(
                        [jp_tmp, word_tmp or word_path], out_path, silence_ms=silence_ms
                    )
                if ok:
                    count += 1
                else:
                    failures.append((MALE_VOICE, word))
            finally:
                for p in (jp_tmp, word_tmp):
                    if p and os.path.exists(p):
                        os.remove(p)
    return count, failures


def generate_sentence_audio(series_map, test_name, series_numbers=None, skip_existing=True):
    """例文（英文）を読み上げる音声（{word}_sentence_m.m4a、男性のみ）。<i>タグは読み上げ用に除去する。"""
    count = 0
    failures = []
    targets = series_numbers if series_numbers is not None else list(series_map.keys())
    for n in targets:
        d = series_map[n]
        series_dir = os.path.join(AUDIO_DIR, test_name, f"Series{n:02d}" if isinstance(n, int) else f"Series{n}")
        os.makedirs(series_dir, exist_ok=True)
        for w in d["words"]:
            word, ex = w[0], w[5]
            sentence = _ITALIC_RE.sub("", ex)
            fname = _safe_filename(word)
            out_path = os.path.join(series_dir, f"{fname}_sentence_m.m4a")
            if skip_existing and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
                count += 1
                continue
            ok = _say_with_retry(MALE_VOICE, out_path, sentence)
            if ok:
                count += 1
            else:
                failures.append((MALE_VOICE, word))
    return count, failures


def generate_continuous_audio(series_map, test_name, series_numbers=None, skip_existing=True, gap_ms=700):
    """そのDayの単語を通しで（発音のみ）1ファイルに連続再生できるよう生成する（all_words_m.m4a、男性のみ）。
    単語間はsayの[[slnc]]埋め込みコマンドで無音を挟む。
    """
    count = 0
    failures = []
    targets = series_numbers if series_numbers is not None else list(series_map.keys())
    for n in targets:
        d = series_map[n]
        series_dir = os.path.join(AUDIO_DIR, test_name, f"Series{n:02d}" if isinstance(n, int) else f"Series{n}")
        os.makedirs(series_dir, exist_ok=True)
        words = [w[0] for w in d["words"]]
        text = f" [[slnc {gap_ms}]] ".join(words)
        out_path = os.path.join(series_dir, "all_words_m.m4a")
        if skip_existing and os.path.exists(out_path) and os.path.getsize(out_path) > 0:
            count += 1
        else:
            ok = _say_with_retry(MALE_VOICE, out_path, text, timeout_sec=60)
            if ok:
                count += 1
            else:
                failures.append((MALE_VOICE, f"series{n}-all"))
    return count, failures
