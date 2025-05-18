import { AnimatePresence, motion } from "framer-motion";
import { RadioGroup } from "@headlessui/react";
import { v4 as uuid } from "uuid";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

interface Question {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  questionText: string[]; // Changed to string array
}

const allQuestions: Question[] = [
  {
    id: 1,
    name: "Behavioral",
    description: "From LinkedIn, Amazon, Adobe",
    difficulty: "Easy",
    questionText: [
      "Tell me about a time you faced a significant challenge. How did you handle it?",
      "Describe a situation where you had to work as part of a team to achieve a goal.",
      "Tell me about a time you failed. What did you learn from it?",
      "Describe a time you had to deal with a difficult client or colleague.",
    ],
  },
  {
    id: 2,
    name: "Technical",
    description: "From Google, Meta, and Apple",
    difficulty: "Medium",
    questionText: [
      "What is a Hash Table, and what is the average case and worst case time for each of its operations?",
      "Explain the concept of recursion in programming.",
      "Describe the difference between a stack and a queue.",
      "What is the time complexity of the following algorithm? [Provide a code snippet]",
    ],
  },
  // Add more questions here
];

const interviewers = [
  {
    id: "John",
    name: "John",
    description: "Software Engineering",
    level: "L3",
  },
  {
    id: "Richard",
    name: "Richard",
    description: "Product Management",
    level: "L5",
  },
  {
    id: "Sarah",
    name: "Sarah",
    description: "Other",
    level: "L7",
  },
];

const ffmpeg = createFFmpeg({
  corePath: "https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js",
  log: true,
});

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DemoPage() {
  const [selectedInterviewType, setSelectedInterviewType] = useState(
    allQuestions[0]
  );
  const [selectedInterviewer, setSelectedInterviewer] = useState(
    interviewers[0]
  );
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const webcamRef = useRef<Webcam | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [seconds, setSeconds] = useState(150);
  const [videoEnded, setVideoEnded] = useState(false);
  const [recordingPermission, setRecordingPermission] = useState(true);
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("Processing");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [generatedFeedback, setGeneratedFeedback] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<Question[]>([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [allResponses, setAllResponses] = useState<
    { question: string; transcript: string; feedback: string }[]
  >([]);
  const [speechSynthesisUtterance, setSpeechSynthesisUtterance] = useState<SpeechSynthesisUtterance>();
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis>();

useEffect(() => {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    setSpeechSynthesis(window.speechSynthesis);
    setSpeechSynthesisUtterance(new SpeechSynthesisUtterance());
  }
}, []);

const speak = useCallback((text: string) => {
  console.log('Speaking:', text); // Added console log
  if (speechSynthesis && SpeechSynthesisUtterance) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }
}, [speechSynthesis, speechSynthesisUtterance]);

  useEffect(() => {
    setIsDesktop(window.innerWidth >= 768);
  }, []);


  const handleDataAvailable = useCallback(
    ({ data }: BlobEvent) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  useEffect(() => {
    if (selectedInterviewType?.name) {
      const filteredQuestions = allQuestions.filter(
        (q) => q.name === selectedInterviewType.name
      );
      setInterviewQuestions(filteredQuestions);
      if (filteredQuestions.length > 0) {
        setCurrentQuestion(filteredQuestions[0]);
      } else {
        setCurrentQuestion(null);
        setInterviewComplete(true);
      }
      setCurrentQuestionIndex(0);
      setInterviewComplete(false);
      setAllResponses([]);
    }
  }, [selectedInterviewType]);

  useEffect(() => {
    if (videoEnded) {
      const element = document.getElementById("startTimer");
      if (element) {
        element.style.display = "flex";
      }
      setCapturing(true);
      setIsVisible(false);
      mediaRecorderRef.current = new MediaRecorder(
        webcamRef?.current?.stream as MediaStream
      );
      mediaRecorderRef.current.addEventListener(
        "dataavailable",
        handleDataAvailable
      );
      mediaRecorderRef.current.start();
    }
  }, [videoEnded, webcamRef, setCapturing, mediaRecorderRef]);

  const handleStartCaptureClick = useCallback(() => {

    const startTimer = document.getElementById("startTimer");
    
    if (startTimer) {
    
    startTimer.style.display = "none";
    
    }
    
    // Initialize MediaRecorder here when recording starts
    
    if (webcamRef.current && webcamRef.current.stream) {
    
    setCapturing(true);
    
    setIsVisible(false);
    
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream);
    
    setRecordedChunks([]); // Clear previous chunks
    
    mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
    
    mediaRecorderRef.current.start();
    
    } else {
    
    console.error("Webcam stream not available.");
    
    // Optionally, set an error state to inform the user
    
    }
    
    }, [currentQuestion, currentQuestionIndex, speak, webcamRef, handleDataAvailable, setCapturing, setIsVisible, setRecordedChunks]);
    
    

  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setCapturing(false);
  }, [mediaRecorderRef, webcamRef, setCapturing]);

  useEffect(() => {
    let timer: any = null;
    if (capturing) {
      timer = setInterval(() => {
        setSeconds((seconds) => seconds - 1);
      }, 1000);
      if (seconds === 0) {
        handleStopCaptureClick();
        setCapturing(false);
        setSeconds(0);
      }
    }
    return () => {
      clearInterval(timer);
    };
  }, [capturing, seconds, handleStopCaptureClick]);

  const processAndGetFeedback = useCallback(
    async (audioBlob: Blob, questionText: string) => {
      setSubmitting(true);
      setStatus("Processing");

      const unique_id = uuid();

      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }

      ffmpeg.FS("writeFile", `${unique_id}.webm`, await fetchFile(audioBlob));
      await ffmpeg.run(
        "-i",
        `${unique_id}.webm`,
        "-vn",
        "-acodec",
        "libmp3lame",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "mp3",
        `${unique_id}.mp3`
      );

      const fileData = ffmpeg.FS("readFile", `${unique_id}.mp3`);
      const output = new File(
        [fileData.buffer as ArrayBuffer],
        `${unique_id}.mp3`,
        {
          type: "audio/mp3",
        }
      );

      const formData = new FormData();
      formData.append("file", output, `${unique_id}.mp3`);
      formData.append("model", "whisper-1");

      setStatus("Transcribing");

      const upload = await fetch(
        `/api/transcribe?question=${encodeURIComponent(questionText)}`,
        {
          method: "POST",
          body: formData,
        }
      );
      const results = await upload.json();

      if (upload.ok) {
        setIsSuccess(true);
        setSubmitting(false);
        let currentTranscript = "";
        if (results.error) {
          currentTranscript = results.error;
          setTranscript(results.error);
        } else {
          currentTranscript = results.transcript;
          setTranscript(results.transcript);
        }

        console.log("Uploaded successfully!");

        let feedbackText = "";
        if (currentTranscript.length > 0) {
          const prompt = `Please give feedback on the following interview question: ${questionText} given the following transcript: ${currentTranscript}. ${
            selectedInterviewType?.name === "Behavioral"
              ? "Please also give feedback on the candidate's communication skills. Make sure their response is structured (perhaps using the STAR or PAR frameworks)."
              : "Please also give feedback on the candidate's communication skills. Make sure they accurately explain their thoughts in a coherent way. Make sure they stay on topic and relevant to the question."
          } \n\n\ Feedback on the candidate's response:`;

          setGeneratedFeedback("");
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
            }),
          });

          if (!response.ok) {
            throw new Error(response.statusText);
          }

          const data = response.body;
          if (!data) {
            return "";
          }

          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            feedbackText = feedbackText + chunkValue;
            setGeneratedFeedback((prev: any) => prev + chunkValue);
          }
        }

        return {
          question: questionText,
          transcript: currentTranscript,
          feedback: feedbackText,
        };
      } else {
        console.error("Upload failed.");
        return {
          question: questionText,
          transcript: "Transcription failed.",
          feedback: "Unable to provide feedback.",
        };
      }
    },
    [selectedInterviewType?.name]
  );

  const handleNextQuestion = async () => {

    if (recordedChunks.length > 0 && currentQuestion) {
    
    const audioBlob = new Blob(recordedChunks, { type: `video/webm` });
    
    const response = await processAndGetFeedback(
    
    audioBlob,
    
    currentQuestion.questionText[currentQuestionIndex] || "" // Access the current question from the array
    
    );
    
    setAllResponses((prev) => [...prev, response]);
    
    setRecordedChunks([]);
    
    }
    
    
    
    if (
    
    currentQuestionIndex <
    
    (currentQuestion?.questionText?.length || 0) - 1
    
    ) {
    
    setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    
    setSeconds(150);
    
    setVideoEnded(false);
    
    setCapturing(false);
    
    setIsVisible(true);
    
    setIsSuccess(false);
    
    setTranscript("");
    
    setGeneratedFeedback("");
    
    // **TTS: Speak the next question**
    
    if (
    
    currentQuestion?.questionText &&
    
    currentQuestion?.questionText[currentQuestionIndex + 1]
    
    ) {
    
    speak(currentQuestion.questionText[currentQuestionIndex + 1]);
    
    }
    
    } else {
    
    // Move to the next set of questions if available
    
    const currentInterviewTypeQuestions = allQuestions.find(
    
    (q) => q.name === selectedInterviewType?.name
    
    );
    
    const currentIndexInAll = allQuestions.findIndex(
    
    (q) => q.id === currentInterviewTypeQuestions?.id
    
    );
    
    
    
    // For now, let's just mark the interview as complete after all questions in the current category are done.
    
    setInterviewComplete(true);
    
    }
    
    };

  function restartVideo() {
    setRecordedChunks([]);
    setVideoEnded(false);
    setCapturing(false);
    setIsVisible(true);
    setSeconds(150);
    setIsSuccess(false);
    setTranscript("");
    setGeneratedFeedback("");
    // **TTS: Re-speak the current question**
    if (
      currentQuestion?.questionText &&
      currentQuestion?.questionText[currentQuestionIndex]
    ) {
      speak(currentQuestion.questionText[currentQuestionIndex]);
    }
  }

  const videoConstraints = isDesktop
    ? { width: 1280, height: 720, facingMode: "user", audio: false } // Explicitly disable audio for webcam video
    : { width: 480, height: 640, facingMode: "user", audio: false }; // Explicitly disable audio for webcam video

    const handleUserMedia = () => {
      setTimeout(() => {
        setLoading(false);
        setCameraLoaded(true);
        // Speak the first question only if it hasn't been spoken yet and we are in step 3
        if (step === 3 && currentQuestion?.questionText && currentQuestion?.questionText[currentQuestionIndex] && !hasSpokenInitialQuestion.current) {
          speak(currentQuestion.questionText[currentQuestionIndex]);
          hasSpokenInitialQuestion.current = true;
        }
      }, 1000);
    };
  
    // Create a useRef to track if the initial question has been spoken
    const hasSpokenInitialQuestion = useRef(false);
  

  return (
    <AnimatePresence>
      {step === 3 ? (
        <div className="w-full min-h-screen flex flex-col px-4 pt-2 pb-8 md:px-8 md:py-2 bg-[#FCFCFC] relative overflow-x-hidden">
          {interviewComplete ? (
            <div className="w-full flex flex-col max-w-[1080px] mx-auto mt-[10vh] overflow-y-auto pb-8 md:pb-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.075, 0.82, 0.165, 1] }}
                className="text-2xl font-semibold text-left text-[#1D2B3A] mb-4"
              >
                Interview Complete!
              </motion.h2>

              {allResponses.map((response, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1 * index,
                    duration: 0.25,
                    ease: [0.23, 1, 0.82, 1],
                  }}
                  className="mt-4 p-4 rounded-lg border border-[#EEEEEE] bg-[#FAFAFA]"
                >
                  <h3 className="text-lg font-semibold text-[#1D2B3A] mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {response.question}
                  </p>
                  <h4 className="text-md font-semibold text-[#1D2B3A] mb-1">
                    Your Answer:
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    {response.transcript || "No answer recorded."}
                  </p>
                  <h4 className="text-md font-semibold text-[#1D2B3A] mb-1">
                    Feedback:
                  </h4>
                  <div className="mt-2 text-sm flex gap-2.5 rounded-lg border border-[#EEEEEE] bg-[#FAFAFA] p-3 leading-6 text-gray-900 min-h-[80px]">
                    <p className="prose prose-sm max-w-none">
                      {response.feedback || "No feedback generated."}
                    </p>
                  </div>
                </motion.div>
              ))}

              <motion.button
                onClick={() => setStep(1)}
                className="group rounded-full mt-8 px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
              >
                Start New Interview
              </motion.button>

              <motion.button
                onClick={() => setStep(1)}
                className="group rounded-full mt-4 px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
              >
                Back to Home
              </motion.button>
            </div>
          ) : (
            <div className="h-full w-full items-center flex flex-col mt-[10vh]">
              {recordingPermission ? (
                <div className="w-full flex flex-col max-w-[1080px] mx-auto justify-center">
                  <h2 className="text-2xl font-semibold text-left text-[#1D2B3A] mb-2">
                    {currentQuestion?.questionText[currentQuestionIndex] ||
                      "Loading question..."}
                  </h2>
                  <span className="text-[14px] leading-[20px] text-[#1a2b3b] font-normal mb-4">
                    Asked by top companies like Google, Facebook and more
                  </span>
                  <motion.div
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.075, 0.82, 0.965, 1],
                    }}
                    className="relative aspect-[16/9] w-full max-w-[1080px] overflow-hidden bg-[#1D2B3A] rounded-lg ring-1 ring-gray-900/5 shadow-md"
                  >
                    {!cameraLoaded && (
                      <div className="text-white absolute top-1/2 left-1/2 z-20 flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 text-white mx-auto my-0.5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth={3}
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    )}
                    <div className="relative z-10 h-full w-full rounded-lg">
                      <div className="absolute top-5 lg:top-10 left-5 lg:left-10 z-20">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-800">
                          {new Date(seconds * 1000).toISOString().slice(14, 19)}
                        </span>
                      </div>
                      {isVisible && ( // If the video is visible (on screen) we show it
                        <div className="block absolute top-[10px] sm:top-[20px] lg:top-[40px] left-auto right-[10px] sm:right-[20px] md:right-10 h-[80px] sm:h-[140px] md:h-[180px] aspect-video rounded z-20">
                          <div className="h-full w-full aspect-video rounded md:rounded-lg lg:rounded-xl">
                            <video
                              id="question-video"
                              onEnded={() => setVideoEnded(true)}
                              controls={false}
                              ref={vidRef}
                              playsInline
                              className="h-full object-cover w-full rounded-md md:rounded-[12px] aspect-video"
                              crossOrigin="anonymous"
                              muted // **Muted the video**
                            >
                              <source
                                src={
                                  selectedInterviewer.name === "John"
                                    ? selectedInterviewType?.name ===
                                      "Behavioral"
                                      ? "https://liftoff-public.s3.amazonaws.com/DemoInterviewMale.mp4"
                                      : "https://liftoff-public.s3.amazonaws.com/JohnTechnical.mp4"
                                    : selectedInterviewer.name === "Richard"
                                    ? selectedInterviewType?.name ===
                                      "Behavioral"
                                      ? "https://liftoff-public.s3.amazonaws.com/RichardBehavioral.mp4"
                                      : "https://liftoff-public.s3.amazonaws.com/RichardTechnical.mp4"
                                    : selectedInterviewer.name === "Sarah"
                                    ? selectedInterviewType?.name ===
                                      "Behavioral"
                                      ? "https://liftoff-public.s3.amazonaws.com/BehavioralSarah.mp4"
                                      : "https://liftoff-public.s3.amazonaws.com/SarahTechnical.mp4"
                                    : selectedInterviewType?.name ===
                                      "Behavioral"
                                    ? "https://liftoff-public.s3.amazonaws.com/DemoInterviewMale.mp4"
                                    : "https://liftoff-public.s3.amazonaws.com/JohnTechnical.mp4"
                                }
                                type="video/mp4"
                              />
                            </video>
                          </div>
                        </div>
                      )}
                      <Webcam
                        mirrored
                        audio
                        muted
                        ref={webcamRef}
                        videoConstraints={videoConstraints}
                        onUserMedia={handleUserMedia}
                        onUserMediaError={(error) => {
                          setRecordingPermission(false);
                        }}
                        className="absolute z-10 min-h-[100%] min-w-[100%] h-auto w-auto object-cover"
                      />
                    </div>
                    {loading && (
                      <div className="absolute flex h-full w-full items-center justify-center">
                        <div className="relative h-[112px] w-[112px] rounded-lg object-cover text-[2rem]">
                          <div className="flex h-[112px] w-[112px] items-center justify-center rounded-[0.5rem] bg-[#4171d8] !text-white">
                            Loading...
                          </div>
                        </div>
                      </div>
                    )}

                    {cameraLoaded && (
                      <div className="absolute bottom-0 left-0 z-50 flex h-[82px] w-full items-center justify-center">
                        {recordedChunks.length > 0 ? (
                          <>
                            {isSuccess ? (
                              <button
                                className="cursor-disabled group rounded-full min-w-[140px] px-4 py-2 text-[13px] font-semibold group inline-flex items-center justify-center text-sm text-white duration-150 bg-green-500 hover:bg-green-600 hover:text-slate-100 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 active:scale-100 active:bg-green-800 active:text-green-100"
                                style={{
                                  boxShadow:
                                    "0px 1px 4px rgba(27, 71, 13, 0.17), inset 0px 0px 0px 1px #5fc767, inset 0px 0px 0px 2px rgba(255, 255, 255, 0.1)",
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mx-auto"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <motion.path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                  />
                                </svg>
                              </button>
                            ) : (
                              <div className="flex flex-row gap-2">
                                {!isSubmitting && (
                                  <button
                                    onClick={() => restartVideo()}
                                    className="group rounded-full px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-white text-[#1E2B3A] hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
                                  >
                                    Restart
                                  </button>
                                )}
                                <button
                                  onClick={handleNextQuestion}
                                  disabled={isSubmitting}
                                  className="group rounded-full min-w-[140px] px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex active:scale-95 scale-100 duration-75 disabled:cursor-not-allowed"
                                  style={{
                                    boxShadow:
                                      "0px 1px 4px rgba(13, 34, 71, 0.17), inset 0px 0px 0px 1px #061530, inset 0px 0px 0px 2px rgba(255, 255, 255, 0.1)",
                                  }}
                                >
                                  <span>
                                    {isSubmitting ? (
                                      <div className="flex items-center justify-center gap-x-2">
                                        <svg
                                          className="animate-spin h-5 w-5 text-slate-50 mx-auto"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                        >
                                          <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                          ></circle>
                                          <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                          ></path>
                                        </svg>
                                        <span>{status}</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center gap-x-2">
                                        <span>Next Question</span>
                                        <svg
                                          className="w-5 h-5"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M13.75 6.75L19.25 12L13.75 17.25"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                          <path
                                            d="M19 12H4.75"
                                            stroke="white"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </div>
                                    )}
                                  </span>
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="absolute bottom-[6px] md:bottom-5 left-5 right-5">
                            <div className="lg:mt-4 flex flex-col items-center justify-center gap-2">
                              {capturing ? (
                                <div
                                  id="stopTimer"
                                  onClick={handleStopCaptureClick}
                                  className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-transparent text-white hover:shadow-xl ring-4 ring-white active:scale-95 scale-100 duration-75 cursor-pointer"
                                >
                                  <div className="h-5 w-5 rounded bg-red-500 cursor-pointer"></div>
                                </div>
                              ) : (
                                <button
                                  id="startTimer"
                                  onClick={handleStartCaptureClick}
                                  className="flex h-8 w-8 sm:h-8 sm:w-8 flex-col items-center justify-center rounded-full bg-red-500 text-white hover:shadow-xl ring-4 ring-white ring-offset-gray-500 ring-offset-2 active:scale-95 scale-100 duration-75"
                                ></button>
                              )}
                              <div className="w-12"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-5xl text-white font-semibold text-center"
                      id="countdown"
                    ></div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.5,
                      duration: 0.15,
                      ease: [0.23, 1, 0.82, 1],
                    }}
                    className="flex flex-row space-x-1 mt-4 items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-[#407BBF]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                    <p className="text-[14px] font-normal leading-[20px] text-[#1a2b3b]">
                      Video is not stored on our servers, it is solely used for
                      transcription.
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="w-full flex flex-col max-w-[1080px] mx-auto justify-center">
                  <motion.div
                    initial={{ y: 20 }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.075, 0.82, 0.165, 1],
                    }}
                    className="relative md:aspect-[16/9] w-full max-w-[1080px] overflow-hidden bg-[#1D"
                  >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <h2 className="text-xl font-semibold text-[#1D2B3A] mb-4">
                        Camera and Microphone Access Required
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Please allow camera and microphone access to start the
                        interview.
                      </p>
                      <button
                        onClick={() => {
                          navigator.mediaDevices
                            .getUserMedia({ video: true, audio: true })
                            .then((stream) => {
                              setRecordingPermission(true);
                              stream
                                .getTracks()
                                .forEach((track) => track.stop()); // Stop the stream immediately
                            })
                            .catch((error) => {
                              console.error(
                                "Error accessing media devices:",
                                error
                              );
                              setRecordingPermission(false);
                            });
                        }}
                        className="group rounded-full px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(25255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
                      >
                        Retry Access
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full min-h-screen flex flex-col px-4 pt-2 pb-8 md:px-8 md:py-2 bg-[#FCFCFC] relative overflow-x-hidden">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.075, 0.82, 0.165, 1] }}
              className="w-full flex flex-col max-w-[600px] mx-auto mt-[15vh] overflow-y-auto pb-8 md:pb-12"
            >
              <h2 className="text-2xl font-semibold text-left text-[#1D2B3A] mb-4">
                Select Interview Type
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                Choose the type of interview questions you&apos;d like to
                practice.
              </p>
              <RadioGroup
                value={selectedInterviewType}
                onChange={setSelectedInterviewType}
              >
                <div className="space-y-2">
                  {allQuestions.map((question) => (
                    <RadioGroup.Option
                      key={question.id}
                      value={question}
                      className={({ active, checked }) =>
                        classNames(
                          active ? "ring-2 ring-[#407BFF] ring-offset-2" : "",
                          checked
                            ? "bg-[#EBF4FF] text-[#2563EB]"
                            : "bg-white text-gray-900",
                          "relative block cursor-pointer rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none"
                        )
                      }
                    >
                      {({ checked }) => (
                        <>
                          <span className="flex items-center justify-between">
                            <span className="block text-sm font-medium">
                              {question.name}
                            </span>
                            {checked && (
                              <svg
                                className="h-5 w-5 text-[#407BFF]"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {question.description} ({question.difficulty})
                          </span>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
              <motion.button
                onClick={() => setStep(2)}
                className="group rounded-full mt-6 px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75"
              >
                Next: Select Interviewer
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.75 6.75L19.25 12L13.75 17.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 12H4.75"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.075, 0.82, 0.165, 1] }}
              className="w-full flex flex-col max-w-[600px] mx-auto mt-[15vh] overflow-y-auto pb-8 md:pb-12"
            >
              <h2 className="text-2xl font-semibold text-left text-[#1D2B3A] mb-4">
                Select Interviewer
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                Choose the interviewer you&apos;d like to simulate with.
              </p>
              <RadioGroup
                value={selectedInterviewer}
                onChange={setSelectedInterviewer}
              >
                <div className="space-y-2">
                  {interviewers.map((interviewer) => (
                    <RadioGroup.Option
                      key={interviewer.id}
                      value={interviewer}
                      className={({ active, checked }) =>
                        classNames(
                          active ? "ring-2 ring-[#407BFF] ring-offset-2" : "",
                          checked
                            ? "bg-[#EBF4FF] text-[#2563EB]"
                            : "bg-white text-gray-900",
                          "relative block cursor-pointer rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:outline-none"
                        )
                      }
                    >
                      {({ checked }) => (
                        <>
                          <span className="flex items-center justify-between">
                            <span className="block text-sm font-medium">
                              {interviewer.name}
                            </span>
                            {checked && (
                              <svg
                                className="h-5 w-5 text-[#407BFF]"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {interviewer.description} (Level {interviewer.level}
                            )
                          </span>
                        </>
                      )}
                    </RadioGroup.Option>
                  ))}
                </div>
              </RadioGroup>
              <motion.button
                onClick={() => setStep(3)}
                disabled={!selectedInterviewType || !selectedInterviewer}
                className="group rounded-full mt-6 px-4 py-2 text-[13px] font-semibold transition-all flex items-center justify-center bg-[#1E2B3A] text-white hover:[linear-gradient(0deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), #0D2247] no-underline flex gap-x-2 active:scale-95 scale-100 duration-75 disabled:cursor-not-allowed"
              >
                Start Interview
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.75 6.75L19.25 12L13.75 17.25"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 12H4.75"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
