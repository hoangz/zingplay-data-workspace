// Help content map: page path → help guide content
const helpContent: Record<string, {
  title: string
  description: string
  steps: string[]
  tips: string[]
}> = {
  '/': {
    title: 'Dashboard',
    description: 'Tổng quan toàn bộ hệ thống Claude của bạn.',
    steps: [
      'Nhìn vào các con số để biết bạn có bao nhiêu agents, skills, commands',
      'Đọc phần Suggestions để biết có vấn đề gì cần sửa không',
      'Click vào bất kỳ card nào để vào trang quản lý chi tiết',
    ],
    tips: ['Đây là trang đầu tiên bạn thấy mỗi khi mở app'],
  },
  '/agents': {
    title: 'Agents — Trợ lý AI',
    description: 'Mỗi agent là một trợ lý AI riêng biệt với tính cách và chuyên môn khác nhau.',
    steps: [
      'Click "New Agent" để tạo trợ lý mới',
      'Điền tên, mô tả và hướng dẫn cho trợ lý',
      'Chọn model phù hợp: Sonnet (cân bằng), Opus (mạnh nhất), Haiku (nhanh nhất)',
      'Vào tab Studio để test trợ lý ngay',
    ],
    tips: [
      'Viết instructions càng chi tiết, trợ lý hoạt động càng tốt',
      'Hover vào card để thấy checkbox chọn nhiều agents cùng lúc',
    ],
  },
  '/commands': {
    title: 'Commands — Lệnh tắt',
    description: 'Tạo lệnh tắt để dùng trong Claude. Gõ /tên-lệnh là AI tự làm theo.',
    steps: [
      'Click "New Command" để tạo lệnh mới',
      'Đặt tên không dấu, không cách (vd: tom-tat, viet-email)',
      'Viết nội dung lệnh — mô tả chi tiết bạn muốn AI làm gì',
      'Dùng lệnh bằng cách gõ /tên-lệnh trong Claude',
    ],
    tips: ['Lệnh tắt giúp bạn không phải gõ đi gõ lại cùng một yêu cầu'],
  },
  '/skills': {
    title: 'Skills — Kỹ năng',
    description: 'Skills là các kỹ năng bổ sung có thể gắn vào nhiều agents khác nhau.',
    steps: [
      'Dùng filter phía trên để lọc theo loại kỹ năng',
      'Click "New Skill" để tạo kỹ năng mới',
      'Import skills từ GitHub bằng nút "Import"',
      'Gắn skill vào agent bằng cách vào trang sửa agent',
    ],
    tips: [
      'Một skill có thể gắn vào nhiều agents khác nhau',
      'Import skills từ GitHub để dùng kỹ năng của cộng đồng',
    ],
  },
  '/graph': {
    title: 'Graph — Sơ đồ kết nối',
    description: 'Bản đồ hiển thị agent nào đang dùng skill/command nào.',
    steps: [
      'Hover vào bất kỳ node nào để thấy các kết nối liên quan',
      'Click vào node để mở trang chỉnh sửa',
      'Dùng ô tìm kiếm hoặc filter để lọc bớt nodes',
      'Zoom in/out bằng scroll chuột',
    ],
    tips: [
      'Node viền đứt = không có kết nối nào (orphan)',
      'Màu đường nối: vàng = spawns, xanh = uses, tím = invokes',
    ],
  },
  '/workflows': {
    title: 'Workflows — Pipeline',
    description: 'Xây dựng chuỗi các bước AI chạy nối tiếp nhau.',
    steps: [
      'Click "New Workflow" để tạo pipeline mới',
      'Thêm các bước — mỗi bước do một agent đảm nhiệm',
      'Sắp xếp thứ tự bằng cách kéo thả',
      'Click "Run" để chạy toàn bộ pipeline',
    ],
    tips: ['Dùng khi muốn nhiều agents phối hợp làm một việc lớn'],
  },
  '/cli': {
    title: 'CLI — Terminal tích hợp',
    description: 'Terminal đầy đủ ngay trong trình duyệt, có theo dõi token và chi phí.',
    steps: [
      'Chọn agent từ dropdown trên (hoặc bỏ trống để dùng Claude mặc định)',
      'Click "Start Session" để mở terminal',
      'Gõ lệnh như terminal thông thường',
      'Xem chi phí và tokens ở panel bên phải',
    ],
    tips: ['Tab Chat: nhắn tin thay vì dùng lệnh terminal'],
  },
  '/history': {
    title: 'History — Lịch sử',
    description: 'Xem lại toàn bộ các cuộc hội thoại Claude CLI theo project.',
    steps: [
      'Chọn project từ danh sách bên trái',
      'Click vào session để xem lại nội dung',
      'Dùng search để tìm project theo tên',
    ],
    tips: ['Lịch sử được đọc từ ~/.claude/projects/ trên máy bạn'],
  },
  '/health': {
    title: 'System Health — Sức khỏe hệ thống',
    description: 'Phát hiện và sửa các vấn đề trong cấu hình agents/skills/commands.',
    steps: [
      'Đọc danh sách cảnh báo (màu vàng = warning, xanh = info)',
      'Click "Fix →" để đi đến trang sửa vấn đề đó',
      'Click Refresh để kiểm tra lại sau khi đã sửa',
    ],
    tips: ['Mục tiêu là đạt Health Score 100%'],
  },
  '/explore': {
    title: 'Explore — Khám phá',
    description: 'Cài đặt agents và skills có sẵn từ cộng đồng.',
    steps: [
      'Browse danh sách templates',
      'Click vào template để xem chi tiết',
      'Click "Install" để cài về máy',
      'Vào Agents/Skills để chỉnh sửa theo nhu cầu',
    ],
    tips: ['Cài template xong vẫn có thể sửa thoải mái'],
  },
  '/settings': {
    title: 'Settings — Cài đặt',
    description: 'Quản lý plugins, MCP servers và cấu hình hệ thống.',
    steps: [
      'Plugins: bật/tắt các plugin đang cài',
      'MCP: thêm MCP servers để kết nối Claude với công cụ bên ngoài',
      'Data Management: backup hoặc restore toàn bộ cấu hình',
    ],
    tips: ['Dùng Export Config để backup trước khi thay đổi lớn'],
  },
}

// Shared state — same ref across all component instances
const isOpen = ref(false)

export function useHelpTooltips() {
  const route = useRoute()

  const currentHelp = computed(() => helpContent[route.path] ?? null)

  // Auto-close when navigating to a page with no help content
  watch(currentHelp, (val) => {
    if (!val) isOpen.value = false
  })

  return { isOpen, currentHelp }
}
