# Projects

## Libris: AI-Powered Digital Library
**Date:** May 2024  **Category:** AI / ML  **Tags:** React Native, TensorFlow, YOLOv8, OpenAI GPT Vision, Mobile
Libris is a fullstack React Native mobile application that uses computer vision and generative AI to digitize physical book collections in seconds. I trained a YOLOv8 real-time object detection model on a custom-labeled dataset of bookshelf images, achieving 90% accuracy in identifying and segmenting individual book spines — enabling batch uploads of 20+ books from a single photo rather than one at a time. For text extraction, I integrated OpenAI's GPT-4 Vision API, achieving 95% accuracy on stylized, embossed, and vertically-oriented spine text that off-the-shelf OCR solutions consistently fail on. The React Native frontend is optimized for cross-platform iOS and Android use, built around reusable components, responsive layouts across device sizes, and accessible interaction patterns that support both camera-based scanning and manual entry flows.

## PIGZJ — Parallel Gzip Compression in Java
**Date:** February 2024  **Category:** Systems  **Tags:** Java, Command Line
PIGZJ is a high-performance multithreaded gzip compression filter implemented in Java, inspired by the pigz utility for multiprocessor servers. I parallelized the compression pipeline by partitioning input streams into fixed-size 128KB blocks and dispatching each block to a thread pool backed by Java's ForkJoinPool, allowing compression work to saturate all available CPU cores simultaneously. To preserve gzip compatibility, I implemented a sliding dictionary that carries the last 32KB of each block into the next, ensuring cross-block back-references remain valid. A separate output thread maintains block ordering and writes the final DEFLATE stream with correct CRC32 checksums. The result is near-linear speedup over single-threaded gzip on multicore hardware — benchmarked on x86-64, ARM, and RISC-V architectures.
Link: https://github.com/izakbunda/CS-131/tree/main/3

## Reliable File Transfer Protocol (TCP) over UDP
**Date:** May 2024  **Category:** Systems  **Tags:** Networking, Java
Built a reliable transport-layer protocol on top of raw UDP in Java, delivering guaranteed, in-order packet transfer with 100% data integrity across a simulated lossy network. I designed a custom packet format modeled after TCP/UDP headers, including sequence numbers, acknowledgment numbers, payload length fields, and a checksum. The implementation uses a fixed-size congestion window with a retransmission timer to handle packet loss and reordering, sustaining an average throughput of 10 Mbps even under adverse network conditions. The protocol was validated against files up to 500 MB in size with zero corruption across thousands of test runs.

## Scalable Application Server Herd
**Date:** May 2024  **Category:** Systems  **Tags:** Networking, Python, Google Places API
Engineered a distributed server herd in Python using asyncio to propagate real-time client location updates across a cluster of five interconnected servers. Each server maintains persistent async TCP connections to its neighbors and uses a flood-fill gossip protocol to replicate location state. To prevent update storms, the protocol stamps each message with an origin timestamp and discards any propagation whose timestamp is older than the current record. Location data feeds directly into the Google Places API to answer dynamic nearby-search queries, and the async event loop keeps all I/O non-blocking.

## Fullstack Social Media Site (Izakstagram)
**Date:** May 2024  **Category:** Web  **Tags:** MongoDB, Express.js, React, Node
A production-grade full-stack social media application built on the MERN stack, featuring posting, likes, a friend graph, a curated feed, and file uploads — all served from a RESTful Node.js/Express API backed by MongoDB. Authentication is handled with JWTs and refresh token rotation; client-side session state is persisted with Redux Toolkit. The React frontend uses React Router for client-side navigation, supports light/dark mode, and is fully responsive down to mobile viewports.

## ReUCLA — Mobile Marketplace App
**Date:** April 2023  **Category:** Mobile  **Tags:** React Native, Node, Firebase, Mobile
ReUCLA is a mobile marketplace built to replace an aging 10-year-old Facebook group that UCLA students were using to buy and sell second-hand clothing. Leading a team of 5 developers, I architected and shipped 10+ screens using custom React Native components. The backend runs on Node.js with Firebase Firestore for real-time CRUD, Firebase Auth for secure user onboarding (email + OAuth), and Firebase Storage for listing photos. I designed a search algorithm that indexes listings and usernames for fast prefix-based lookup. The app was demoed to 200+ students and received strong interest from UCLA's sustainability initiatives.
Link: https://github.com/izakbunda/ReUCLA

## Spotify Stats Hub
**Date:** June 2022  **Category:** Web  **Tags:** Next.js, React, Spotify API
A Next.js web application that connects to the Spotify API and surfaces personalized listening analytics — top tracks and top artists broken down by short, medium, and long time windows — alongside a song-guessing minigame that tests how well users know their own taste. Authorization follows the implicit grant OAuth flow so no backend server is needed. The token is persisted in Redux Toolkit to survive page navigations without re-authenticating.
Link: https://github.com/izakbunda/Spotify-Stats-Hub

# Internships

## Software Development Intern at Hunter Industries
Led development of 'Irrigation My Design,' an interactive MVP tool that lets landscape architects plan sprinkler systems on a live map canvas. Built with React and Fabric.js, the tool renders draggable, resizable sprinkler head objects on a Google Maps satellite layer. I integrated Google Earth's imagery import API so users could pull in high-resolution aerial photos of job sites directly into the canvas. The product was scoped to serve 15,000 landscaping professionals and projected to add $80M in annual value. Worked within a Scrum team, shipping in two-week sprints with TDD coverage on all core business logic.
Link: https://irrigation-my-design.vercel.app/

## Frontend Development Intern at Hussle, Inc
Developed and shipped responsive page layouts for the Hussle gig-economy app using React Native, React Navigation, and the Animated API. I built 10+ screens from design mockups — including Explore, Profile, Referral, and onboarding flows — and refactored shared UI into a reusable component library that reduced per-screen code by ~40%. Hussle was live in the iOS App Store and deployed on Heroku across dev and production environments.
Link: https://apps.apple.com/us/app/hussle-local-college-gigs/id1573358782
