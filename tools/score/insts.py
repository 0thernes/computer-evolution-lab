"""The lean VSCO-2 CE subset used by the cues (all CC0)."""
import glob, re
from lib import Inst, VSCO, load, lowest_partial
G = lambda p: sorted(glob.glob(f'{VSCO}/{p}'))
def lib():
    I = {}
    I['vln'] = Inst('Violin section sustain', G('Strings/Violin Section/susVib/*.wav'), gain=0.9)
    I['vla'] = Inst('Viola section sustain', G('Strings/Viola Section/susvib/*.wav'), gain=0.9)
    I['vc'] = Inst('Cello section sustain', G('Strings/Cello Section/susvib/*.wav'), gain=0.95)
    I['cb'] = Inst('Contrabass sustain', G('Strings/Solo Contrabass/SusVib/*.wav'), layer_re=r'_v(\d)', gain=1.1)
    I['vln_sp'] = Inst('Violin section spiccato', G('Strings/Violin Section/Spic/*.wav'), kind='hit', gain=0.9)
    I['vla_sp'] = Inst('Viola section spiccato', G('Strings/Viola Section/spic/*.wav'), kind='hit', gain=0.9)
    I['vc_sp'] = Inst('Cello section spiccato', G('Strings/Cello Section/spic/*.wav'), kind='hit', gain=1.0)
    I['cb_sp'] = Inst('Contrabass spiccato', G('Strings/Solo Contrabass/Spic/*.wav'), kind='hit', gain=1.1)
    I['hn'] = Inst('French horn sustain', G('Brass/F Horn/sus/*.wav'), gain=0.85)
    I['tbn'] = Inst('Tenor trombone sustain', G('Brass/Tenor Trombone/sus/*.wav'), gain=0.8)
    I['tba'] = Inst('Tuba sustain', G('Brass/Tuba/sus/*.wav'), gain=0.9)
    I['fl'] = Inst('Flute (non-vibrato)', G('Woodwinds/Flute/susNV/*.wav'), gain=0.7)
    I['harp'] = Inst('Harp', G('Strings/Harp/*.wav'), kind='hit', gain=0.8, off=0)
    I['glock'] = Inst('Glockenspiel', G('Percussion/Glock/*.wav'), kind='hit', gain=0.5)
    # piano: Player_dynN_rr1_IDX.wav, IDX -> key number from MappingChart (000=21 step 2)
    pf = G('Keys/Upright Piano/Player_dyn*_rr1_*.wav')
    I['pno'] = Inst('Upright piano', pf, kind='hit', layer_re=r'dyn(\d)', gain=1.0, fixed=lambda f: 21 + 2 * int(re.search(r'_(\d{3})\.wav', f).group(1)))
    # organ: Rode_Man3Open_NN / Rode_Pedal_NN, NN = key number from C (pitch-verified)
    of = G('Keys/Organ/Loud/*.wav'); I['org'] = Inst('Pipe organ (Rode, manual 3 open)', [f for f in of if 'Man3Open' in f], gain=0.55, layer_re=r'(Z)', fixed=lambda f: round(lowest_partial(load(f))))
    I['orgped'] = Inst('Pipe organ pedal', [f for f in of if 'Pedal' in f], gain=0.6, layer_re=r'(Z)', fixed=lambda f: round(lowest_partial(load(f))))
    return I
UNPITCHED = {  # one-shots: name -> files (velocity-ordered where it matters)
    'timp_hit': G('Percussion/Timpani/Timpani*_Hit_v3_rr1_Sum.wav'), 'timp_roll': G('Percussion/Timpani/Rolls/*v5*.wav'),
    'taiko': G('VSCO 1 Percussion/drums/other/ethnic/giant/mallet/*hit_f*.wav') + G('VSCO 1 Percussion/drums/other/ethnic/giant/mallet/*hit_ff*.wav'),
    'taiko_lo': G('VSCO 1 Percussion/drums/other/ethnic/giant/hand/*hit_ff*.wav'), 'bd': G('Percussion/BDrumNewhit_v6_rr1_Sum.wav') + G('Percussion/BDrumNewhit_v7_rr1_Sum.wav'),
    'crash': G('Percussion/cymbal-crash1_mf_rr1.wav'), 'swell': G('Percussion/susCymb1-cresc-Median_v1.wav'), 'swell_long': G('Percussion/susCymb1-cresc-Long_v1.wav'),
    'gong': G('Percussion/gongHit_mf.wav'), 'clave': G('Percussion/Claves1_Hit_*.wav'), 'bow': G('Percussion/susCymb1-bow-*.wav'), 'vibra': G('Percussion/vibraring_v1_*.wav'),
}
