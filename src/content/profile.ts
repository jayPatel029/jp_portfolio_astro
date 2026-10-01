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
  headline: 'I make vision and language models work on real documents and real GPUs.',
  summary:
    'AI/ML Engineer with hands-on experience in computer vision, document intelligence, VLMs, and production inference systems. Skilled in Python, deep learning, image retrieval, OCR pipelines, LLM/VLM integration, and model optimization for resource-constrained environments.',
  location: 'Pune, Maharashtra, India',
  status: 'Software Engineer (AI/ML) at Atomic Loops, Pune',
  email: 'jaysunilpatel2002@gmail.com',
  cvUrl: 'https://drive.google.com/file/d/1FPes37W_uQVm1JhnTfYBQP0lj1Au74JE/view?usp=sharing',
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
    grade: 'CGPA 7.4',
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
        'Built a production-grade document intelligence pipeline using PaddleOCR and Qwen2.5-VL 7B, combining image preprocessing, raw OCR extraction, and prompts to transform invoices and manufacturing documents into structured JSON.',
        'Optimized Qwen2.5-VL for constrained GPU environments using 4-bit quantization with BitsAndBytes and Transformers, enabling local VLM inference within approximately 6 GB of GPU memory on a 10 GB GPU.',
        'Developed a fine-grained image similarity search system using DINOv2 embeddings to identify industrial objects and tools with subtle visual differences in shape, component count, and spatial configuration.',
        'Improved fine-grained retrieval by using patch-level embeddings instead of a single CLS-token representation, preserving localized visual features and improving top-match retrieval for visually similar objects.',
        'Built a Python-based image inference service handling image preprocessing, model inference, and result storage, using ONNX batched inference and thread pools to process multiple images concurrently.',
        'Trained and deployed YOLO models for real-time tool detection and counting, optimizing models for accuracy and low-latency inference.',
        'Designed agentic AI pipelines using LLMs and Pydantic-AI for structured outputs, response validation, and multi-step AI workflows.',
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
      label: 'parameter VLM (Qwen2.5-VL) running locally on a 10 GB GPU',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '~6 GB',
      label: 'GPU memory used after 4-bit quantization',
      source: 'Document Intelligence Pipeline',
    },
    {
      value: '94%+',
      label: 'accuracy in QR code forgery detection',
      source: 'QR Code Counterfeit Detection',
    },
    {
      value: '60%+',
      label: 'less manual HR effort through OCR-driven onboarding',
      source: 'AI-Powered Onboarding Automation',
    },
  ],
  projects: [
    {
      slug: 'document-intelligence',
      title: 'Document Intelligence Pipeline',
      cluster: 'document-ai',
      origin: 'Atomic Loops',
      summary: 'Production pipeline that turns invoices and manufacturing documents into structured JSON.',
      highlights: [
        'Combines image preprocessing, raw OCR extraction with PaddleOCR, and prompting Qwen2.5-VL 7B.',
        '4-bit quantization with BitsAndBytes keeps local VLM inference within ~6 GB of GPU memory on a 10 GB GPU.',
      ],
      stack: ['PaddleOCR', 'Qwen2.5-VL 7B', 'Transformers', 'BitsAndBytes', 'Python'],
      links: [],
    },
    {
      slug: 'fine-grained-retrieval',
      title: 'Fine-Grained Image Similarity Search',
      cluster: 'vision',
      origin: 'Atomic Loops',
      summary:
        'Identifies industrial objects and tools that differ only subtly in shape, component count and spatial configuration.',
      highlights: [
        'Built on DINOv2 embeddings.',
        'Patch-level embeddings instead of a single CLS token preserve localized features and improve top-match retrieval for visually similar objects.',
      ],
      stack: ['DINOv2', 'Patch-level embeddings', 'Python'],
      links: [],
    },
    {
      slug: 'tool-detection',
      title: 'Real-Time Tool Detection & Counting',
      cluster: 'vision',
      origin: 'Atomic Loops',
      summary: 'YOLO models trained and deployed to detect and count tools in real time.',
      highlights: ['Optimized for both accuracy and low-latency inference.'],
      stack: ['YOLO', 'Python'],
      links: [],
    },
    {
      slug: 'agentic-pipelines',
      title: 'Agentic AI Pipelines',
      cluster: 'llm-agents',
      origin: 'Atomic Loops',
      summary: 'Multi-step LLM workflows with structured, validated outputs.',
      highlights: ['Pydantic-AI enforces structured outputs and response validation across workflow steps.'],
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
