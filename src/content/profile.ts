import type { Profile, ProjectCluster } from './types';

export const clusterLabels: Record<ProjectCluster, string> = {
  vision: 'Vision',
  'document-ai': 'Document AI',
  'llm-agents': 'LLM / Agents',
  systems: 'Systems',
};

export const profile: Profile = {
  name: 'Jay Patel',
  initials: 'JP',
  role: 'AI/ML Engineer',
  headline:
    'I make vision and language models survive production: tight GPUs, messy lighting, and numbers that cannot be invented.',
  summary: [
    "I'm an AI/ML engineer at Atomic Loops in Pune. I take vision and language models and make them hold up under the constraints that show up after the demo: a 10 GB GPU, a production line that does not look like the training set, and outputs that a downstream system has to trust.",
    'The thing I keep learning is that the native approach often works in a notebook and fails in production. When it does, I go back into how the model actually represents the data — CLS versus patches, raw OCR versus a VLM guessing numbers — and change the pipeline, not just the prompt.',
  ],
  location: 'Pune, Maharashtra, India',
  status: 'Software Engineer (AI/ML) at Atomic Loops, Pune',
  email: 'jaysunilpatel2002@gmail.com',
  cvUrl: 'https://drive.google.com/file/d/1kkeV_QpuJybhdM27z8ZqLrQCfuqkcjmH/view?usp=sharing',
  socials: [
    { label: 'GitHub', href: 'https://github.com/jayPatel029' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jay-patel-7aa2a3253/' },
  ],
  education: {
    school: 'MIT Academy of Engineering',
    degree: 'B.Tech in Computer Engineering',
    location: 'Pune, Maharashtra',
    start: 'Dec 2021',
    end: 'Jul 2025',
    grade: 'CGPA 7.57',
  },
  skills: [
    { layer: 'Languages', items: ['Python', 'Java'] },
    {
      layer: 'Computer Vision',
      items: ['OpenCV', 'YOLO', 'DINOv2', 'OpenVINO', 'PaddleOCR', 'MobileNetV2'],
    },
    {
      layer: 'ML & Deep Learning',
      items: ['TensorFlow', 'Keras', 'ONNX', 'XGBoost', 'Model Quantization'],
    },
    {
      layer: 'LLM & VLM',
      items: ['Qwen2.5-VL', 'Local VLM Inference', 'Pydantic-AI', 'Prompt Engineering'],
    },
    {
      layer: 'Inference & Systems',
      items: ['Transformers', 'BitsAndBytes', 'Batched Inference', 'Multithreading', 'Parallel Processing'],
    },
    { layer: 'Backend', items: ['Node.js', 'REST APIs', 'JWT Authentication'] },
    {
      layer: 'Data & Infrastructure',
      items: ['BeautifulSoup', 'Dataset Generation', 'OCR Pipelines', 'MySQL', 'MariaDB', 'AWS S3', 'Git'],
    },
  ],
  experience: [
    {
      role: 'Software Engineer (AI/ML)',
      company: 'Atomic Loops',
      location: 'Pune',
      start: 'Aug 2025',
      end: null,
      stage: 'production',
      highlights: [
        {
          text: 'Built a two-stage retrieval pipeline for near-identical industrial tools, after CLS embeddings kept returning two almost-tied matches.',
          href: '#project-fine-grained-retrieval',
        },
        {
          text: 'Grounded a 7B VLM in cleaned OCR text and a JSON schema so it would stop inventing numbers, and ran it in 4-bit on a 10 GB GPU.',
          href: '#project-document-intelligence',
        },
        {
          text: 'Trained a tool detector on ideal images, then iterated augmentations until it survived glare, shadows, and camera distance on the line.',
          href: '#project-tool-detection',
        },
      ],
    },
    {
      role: 'Full Stack Developer Intern',
      company: 'Kifayti Health',
      location: 'Bangalore (Remote)',
      start: 'Oct 2024',
      end: 'Jul 2025',
      stage: 'fine-tuning',
      highlights: [
        'Built and optimized backend systems using Node.js and MariaDB, implementing REST APIs and JWT authentication.',
        'Integrated Fitbit (OAuth 2.0) and Google Health SDK for real-time health data synchronization.',
        'Developed automation features using WorkManager and Firebase Cloud Messaging (FCM) for alerts and notifications.',
        'Deployed backend services on a VPS and integrated AWS S3 for secure storage.',
      ],
    },
    {
      role: 'Flutter Developer Intern',
      company: 'Woodesy',
      start: 'Jun 2024',
      end: 'Oct 2024',
      stage: 'warm-up',
      highlights: [
        'Engineered Flutter apps for drivers, users, and vendors.',
        'Led the backend migration to Node.js.',
        'Optimized lazy loading and API integrations, and implemented GetX for state management.',
      ],
    },
  ],
  metrics: [
    {
      value: '7B',
      label: 'parameter VLM running locally on a 10 GB GPU',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '~90%',
      label: 'close matches resolved without review after a patch-level rerank',
      source: 'Fine-Grained Image Similarity Search',
    },
    {
      value: '10–15 s',
      label: 'to turn one document into structured JSON',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '94%+',
      label: 'accuracy in QR code forgery detection',
      source: 'QR Code Counterfeit Detection',
    },
  ],
  projects: [
    {
      slug: 'fine-grained-retrieval',
      title: 'Fine-Grained Image Similarity Search',
      cluster: 'vision',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A small catalog of near-identical industrial tools, where a global embedding was not enough.',
      problem:
        'About 10–12 classes, 10–15 images each. A CLS-token embedding retrieved a top-5 where the top two scores sat 0.1–0.2 apart. That margin kept tripping a “needs review” threshold.',
      decision:
        'A CLS token is a global summary of the image. Patch embeddings keep local structure — component count, shape, spatial layout. Keep CLS for candidate retrieval. When the margin is that tight, rerank by comparing the query’s patch embedding against two or three exemplars from each of the top-2 classes.',
      result: 'About 5–10% of queries still need review. The rest resolve without it.',
      highlights: [],
      stack: ['DINOv2', 'Patch-level embeddings', 'Python'],
      links: [],
    },
    {
      slug: 'document-intelligence',
      title: 'Document Intelligence Pipeline',
      cluster: 'document-ai',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A 7B VLM that is not allowed to invent the numbers on an invoice.',
      problem:
        'Prompting the VLM on the image alone, even with strict instructions, it invented values — especially numbers.',
      decision:
        'Run PaddleOCR, clean the raw text, and pass that to Qwen2.5-VL with a prompt and a JSON schema for the response. Token cost went up; brought it back with image downscaling and compact JSON. The unquantized model is about 16 GB and would not load on the 10 GB GPU, so 4-bit quantization (BitsAndBytes) brings it to about 6 GB resident. There is no quality comparison to the original weights: they never ran.',
      result: 'Usable, schema-shaped output in about 90% of cases. One document takes 10–15 seconds.',
      highlights: [],
      stack: ['PaddleOCR', 'Qwen2.5-VL 7B', 'Transformers', 'BitsAndBytes', 'Python'],
      links: [],
    },
    {
      slug: 'tool-detection',
      title: 'Tool Detection & Counting',
      cluster: 'vision',
      origin: 'Atomic Loops',
      featured: true,
      summary: 'A detector that was accurate in the training photos and blind under the lights on the line.',
      problem:
        'Training images were well-lit and clean. On the line, overhead glare deleted objects, a cover threw shadows, and camera distance changed how the tools looked.',
      decision: 'Iterate: new augmentations and new datasets until those failure modes shrank.',
      result:
        '5–10 seconds to process the frames that actually arrive (not five frames per second). Counting holds up under the lighting we ship with.',
      highlights: [],
      stack: ['YOLO', 'Python'],
      links: [],
    },
    {
      slug: 'agentic-pipelines',
      title: 'Agentic AI Pipelines',
      cluster: 'llm-agents',
      origin: 'Atomic Loops',
      summary: 'A sequential LLM pipeline whose outputs are checked before they are trusted.',
      highlights: [
        'A class or domain becomes a dynamic prompt, sent to the OpenAI API. The JSON response is validated through stacked Pydantic models, then passed through sequential tools — web search, URL checks, language and grammar, and math checks on any numbers — and merged at the end.',
        'If a block fails it retries three times, then flags the run.',
      ],
      stack: ['LLMs', 'Pydantic-AI', 'Python'],
      links: [],
    },
    {
      slug: 'batched-inference-service',
      title: 'Batched Image Inference Service',
      cluster: 'systems',
      origin: 'Atomic Loops',
      summary: 'Python service covering image preprocessing, model inference and result storage.',
      highlights: ['ONNX batched inference and thread pools process multiple images concurrently.'],
      stack: ['ONNX', 'Python', 'Thread pools'],
      links: [],
    },
    {
      slug: 'emotion-recognition',
      title: 'Multi-Modal Emotion Recognition',
      cluster: 'vision',
      origin: 'Major project',
      summary: 'Offline system that classifies user emotions from facial and speech inputs.',
      highlights: [
        'Trained on the FER and RAVDESS datasets.',
        'Combines CNNs and LSTMs with decision-level fusion to improve accuracy across modalities.',
      ],
      stack: ['Python', 'TensorFlow', 'Keras', 'OpenCV'],
      links: [
        {
          label: 'Project files',
          href: 'https://drive.google.com/file/d/13V16cqKzv0VOzFo4fvVet9S08sUplgpe/view?usp=drive_link',
        },
      ],
    },
    {
      slug: 'qr-counterfeit-detection',
      title: 'QR Code Counterfeit Detection',
      cluster: 'vision',
      origin: 'Major project',
      summary: 'CNN-based forgery detection for QR codes.',
      highlights: [
        'Achieved 94%+ accuracy with a MobileNetV2-based CNN.',
        'Benchmarked against HOG, LBP and ORB features with XGBoost.',
      ],
      stack: ['TensorFlow', 'Keras', 'OpenCV', 'XGBoost'],
      links: [{ label: 'Code', href: 'https://github.com/jayPatel029/QR-Code-Authenticaiton-using-ML' }],
    },
    {
      slug: 'onboarding-automation',
      title: 'AI-Powered Onboarding Automation',
      cluster: 'document-ai',
      origin: 'Major project',
      summary: 'Automated document parsing and form-filling for HR onboarding.',
      highlights: [
        'OCR and regex-based extraction cut HR effort by over 60%.',
        'Scalable full-stack platform with a Flutter frontend and Django backend.',
      ],
      stack: ['Flutter', 'Django', 'OCR'],
      links: [
        { label: 'Code', href: 'https://github.com/jayPatel029/Automated-Candidate-Onboarding-System' },
        { label: 'Demo video', href: 'https://www.youtube.com/watch?v=oGSM1IDRRDo' },
      ],
    },
  ],
  archive: [
    {
      title: 'Crypto Trade-Sentiment Analysis',
      description:
        'Historical crypto trades analyzed against the Fear & Greed Index to find patterns in trader behavior and profitability across sentiment phases.',
      stack: ['Python', 'Pandas', 'Matplotlib', 'Seaborn'],
      href: 'https://github.com/jayPatel029/crypto-trade-sentiment-analysis',
    },
    {
      title: 'Credit Card Scraper',
      description:
        'Extracts credit card information from web pages or PDF documents using an LLM (Groq API), with a Streamlit UI.',
      stack: ['Python', 'LLM', 'Streamlit'],
      href: 'https://github.com/jayPatel029/credit_ard_scraper_bh',
    },
  ],
  achievements: [
    {
      title: 'Amazon ML Hackathon',
      description: 'Developed an ML pipeline for entity extraction (OCR + NLP).',
    },
  ],
};
