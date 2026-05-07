project/
├── src/
│ ├── bots/ # Setiap bot punya folder sendiri
│ │ ├── taskBot/
│ │ │ ├── index.ts # Register semua command & action bot ini
│ │ │ ├── commands/ # /start, /assign, dll
│ │ │ ├── actions/ # Callback inline keyboard
│ │ │ └── scenes/ # Multi-step conversation
│ │ │
│ │ └── deliverableBot/
│ │ ├── index.ts
│ │ ├── commands/
│ │ ├── actions/
│ │ └── scenes/
│ │
│ ├── services/ # Business logic, shared antar bot
│ │ ├── task.service.ts
│ │ ├── deliverable.service.ts
│ │ ├── notion.service.ts # Integrasi Notion API
│ │ └── notification.service.ts # Kirim pesan antar bot
│ │
│ ├── repositories/ # Semua query Prisma di sini
│ │ ├── task.repository.ts
│ │ ├── deliverable.repository.ts
│ │ └── user.repository.ts
│ │
│ ├── prisma/
│ │ ├── client.ts # Instance Prisma (singleton)
│ │ └── schema.prisma
│ │
│ ├── middlewares/ # Middleware Telegraf
│ │ ├── auth.middleware.ts # Validasi user boleh akses bot
│ │ └── logger.middleware.ts # Log setiap aktivitas user
│ │
│ ├── utils/
│ │ ├── keyboard.ts # Semua inline keyboard
│ │ ├── message.ts # Template teks pesan
│ │ └── logger.ts # Setup Winston/Pino logger
│ │
│ ├── types/
│ │ └── context.ts # Custom Telegraf context
│ │
│ └── main.ts # Entry point, jalankan semua bot
│
├── logs/ # File log error & aktivitas
│ ├── error.log
│ └── combined.log
│
├── prisma/
│ └── schema.prisma # Prisma schema utama
│
├── .env
├── .env.example # Template env untuk tim
├── package.json
└── tsconfig.json
