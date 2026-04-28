import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { createAPI, type APIError } from 'react-native-nitro-api';

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('Ready');
  const [error, setError] = useState<APIError | null>(null);

  const api = useMemo(
    () =>
      createAPI({
        baseURL: 'https://jsonplaceholder.typicode.com',
        debug: true,
        cache: {
          enabled: true,
          defaultTTL: 30_000,
          staleWhileRevalidate: true,
        },
      }),
    [],
  );

  const resetState = () => {
    setError(null);
    setResult('Running...');
  };

  const runSingleGet = async () => {
    resetState();
    setLoading(true);
    try {
      const post = await api.get<Post>('/posts/:id', {
        routeParams: { id: 1 },
      });
      setResult(`GET /posts/1 -> ${post.title}`);
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  const runDedupeProbe = async () => {
    resetState();
    setLoading(true);
    try {
      const start = Date.now();
      const [a, b] = await Promise.all([
        api.get<Post>('/posts/:id', { routeParams: { id: 2 } }),
        api.get<Post>('/posts/:id', { routeParams: { id: 2 } }),
      ]);
      setResult(
        `Dedupe probe OK (${Date.now() - start}ms). Both responses share title: "${a.title}" / "${b.title}"`,
      );
    } catch (err) {
      setError(err as APIError);
    } finally {
      setLoading(false);
    }
  };

  const runErrorProbe = async () => {
    resetState();
    setLoading(true);
    try {
      await api.get('/invalid-endpoint');
      setResult('Unexpected success');
    } catch (err) {
      const normalized = err as APIError;
      setError(normalized);
      setResult('Error probe completed (expected failure).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: safeAreaInsets.top + 12,
            paddingBottom: safeAreaInsets.bottom + 24,
          },
        ]}>
        <Text style={styles.title}>react-native-nitro-api</Text>
        <Text style={styles.subtitle}>Native example harness</Text>

        <View style={styles.buttonRow}>
          <ActionButton title="Single GET" onPress={runSingleGet} disabled={loading} />
          <ActionButton title="Dedupe Probe" onPress={runDedupeProbe} disabled={loading} />
          <ActionButton title="Error Probe" onPress={runErrorProbe} disabled={loading} />
        </View>

        {loading ? <ActivityIndicator size="large" /> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Result</Text>
          <Text style={styles.cardBody}>{result}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Normalized Error</Text>
          <Text style={styles.cardBody}>
            {error
              ? `message: ${error.message}\nstatus: ${error.status}\ndata: ${JSON.stringify(
                  error.data ?? null,
                )}`
              : 'No error'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : null,
        pressed ? styles.buttonPressed : null,
      ]}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C0F',
  },
  content: {
    gap: 14,
    paddingHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  buttonRow: {
    gap: 10,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#16181D',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#23262D',
  },
  cardTitle: {
    color: '#D4D4D8',
    fontWeight: '700',
    marginBottom: 6,
  },
  cardBody: {
    color: '#E4E4E7',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default App;
