import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useMobileAura } from '../context/MobileAuraContext';

export default function MobileVoiceModal() {
  const { 
    voiceModalOpen, 
    setVoiceModalOpen, 
    voiceState, 
    voiceHistory, 
    sendVoiceQuery 
  } = useMobileAura();

  const [inputText, setInputText] = useState('');

  if (!voiceModalOpen) return null;

  const quickPrompts = [
    { label: "What is our current ETA?", cat: "ETA" },
    { label: "Why did you choose this route?", cat: "Route" },
    { label: "How bad is traffic at Uppal?", cat: "Traffic" },
    { label: "Is Gandhi Hospital ready?", cat: "Hospital" },
    { label: "What are the patient vitals?", cat: "Vitals" },
    { label: "How many vehicles are nearby?", cat: "Safety" },
    { label: "Divert to Yashoda Hospital", cat: "Divert" }
  ];

  const handleSend = async (queryText) => {
    const text = queryText || inputText;
    if (!text || !text.trim()) return;
    setInputText('');
    await sendVoiceQuery(text);
  };

  const isListening = voiceState === 'LISTENING';
  const isAnalyzing = voiceState === 'ANALYZING';
  const isSpeaking = voiceState === 'SPEAKING';

  return (
    <Modal
      visible={voiceModalOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setVoiceModalOpen(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerIcon}>🎙️</Text>
              <Text style={styles.headerTitle}>AURA Driver Voice Assistant</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setVoiceModalOpen(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Voice State Status Bar */}
          <View style={[
            styles.statusBar,
            isListening ? styles.statusListening :
            isAnalyzing ? styles.statusAnalyzing :
            isSpeaking ? styles.statusSpeaking : styles.statusReady
          ]}>
            {isAnalyzing && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />}
            <Text style={styles.statusText}>
              {isListening ? '🎙️ LISTENING TO DRIVER...' :
               isAnalyzing ? '🧠 ANALYZING WITH AURA AGENT CORE...' :
               isSpeaking ? '🔊 AURA IS SPEAKING...' : '🟢 READY — SPEAK OR TAP A PROMPT'}
            </Text>
          </View>

          {/* Quick Prompts Carousel */}
          <View style={styles.promptsContainer}>
            <Text style={styles.promptsTitle}>DRIVER QUICK QUESTIONS:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsScroll}>
              {quickPrompts.map((p, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSend(p.label)}
                  style={styles.promptChip}
                  disabled={isAnalyzing || isSpeaking}
                >
                  <Text style={styles.promptChipText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Dialog Chat History */}
          <ScrollView style={styles.chatHistory} contentContainerStyle={{ paddingVertical: 10 }}>
            {voiceHistory.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🚑</Text>
                <Text style={styles.emptyTitle}>Hands-Free Voice Copilot</Text>
                <Text style={styles.emptySub}>
                  Ask natural questions about ETA, traffic congestion, patient vitals, or hospital trauma beds.
                </Text>
              </View>
            ) : (
              voiceHistory.map((item, idx) => (
                <View key={idx} style={styles.messageGroup}>
                  {/* Driver Query */}
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{item.query}</Text>
                  </View>
                  {/* AURA Agent Response */}
                  <View style={styles.auraBubble}>
                    <View style={styles.auraHeader}>
                      <Text style={styles.auraLabel}>AURA AI &bull; {item.category || 'Intelligence'}</Text>
                      <Text style={styles.auraIntent}>{item.intent}</Text>
                    </View>
                    <Text style={styles.auraText}>{item.response_text}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Input Footer */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask AURA or tap prompt above..."
              placeholderTextColor="#64748b"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSend(inputText)}
            />
            <TouchableOpacity 
              onPress={() => handleSend(inputText)}
              style={styles.sendButton}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '85%',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 12
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  closeButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b'
  },
  closeButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10
  },
  statusListening: { backgroundColor: '#e11d48' },
  statusAnalyzing: { backgroundColor: '#d97706' },
  statusSpeaking: { backgroundColor: '#059669' },
  statusReady: { backgroundColor: '#1e293b' },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
  promptsContainer: {
    marginTop: 12
  },
  promptsTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  promptsScroll: {
    flexDirection: 'row'
  },
  promptChip: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8
  },
  promptChipText: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '600'
  },
  chatHistory: {
    height: 240,
    marginTop: 10
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold'
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20
  },
  messageGroup: {
    marginBottom: 12
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '85%',
    marginBottom: 6
  },
  userText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500'
  },
  auraBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '90%'
  },
  auraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  auraLabel: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold'
  },
  auraIntent: {
    color: '#94a3b8',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  auraText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 13
  },
  sendButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13
  }
});
