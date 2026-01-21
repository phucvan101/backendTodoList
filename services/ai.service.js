const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo GenAI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

class AIService {
    constructor() {
        // Sử dụng Gemini 2.0 Flash - Tốc độ cực nhanh, hỗ trợ JSON mode tốt
        this.model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        });
    }

    /**
     * Hàm gọi AI an toàn: Tự động xử lý lỗi 429 (Too Many Requests)
     */
    async safeGenerate(prompt, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const result = await this.model.generateContent(prompt);
                const text = result.response.text();

                // Trả về đối tượng JSON đã parse
                return JSON.parse(text);
            } catch (error) {
                // Kiểm tra nếu lỗi là do quá hạn mức (429)
                const isRateLimit = error.message?.includes('429') || error.status === 429;

                if (isRateLimit && i < retries - 1) {
                    // Đợi lâu hơn một chút cho bản 2.0 (tăng dần: 6s, 12s...)
                    const waitTime = (i + 1) * 6000;
                    console.warn(`[Gemini 2.0] Chạm giới hạn. Thử lại lần ${i + 1} sau ${waitTime / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                console.error(`[Gemini 2.0 Error]:`, error.message);
                throw new Error(`AI không thể xử lý yêu cầu lúc này: ${error.message}`);
            }
        }
    }

    // 1. Tạo task chi tiết từ mô tả ngắn
    async generateTaskDetails(shortDescription, context = {}) {
        const prompt = `Bạn là AI quản lý công việc chuyên nghiệp.
Nhiệm vụ: Phân tích mô tả "${shortDescription}" và tạo task JSON.
Context: Categories: ${context.categories?.join(', ') || 'n/a'}.

YÊU CẦU JSON (Tiếng Việt):
{
  "title": "Tiêu đề task",
  "description": "Mục tiêu và các bước thực hiện",
  "priority": "low|medium|high|urgent",
  "estimatedTime": "VD: 1 hour",
  "suggestedDueDate": "Số ngày từ hôm nay (VD: 2)",
  "tags": ["tag1", "tag2"],
  "checklist": ["Bước 1", "Bước 2"]
}
CHỈ TRẢ VỀ JSON.`;

        const taskDetails = await this.safeGenerate(prompt);

        // Logic tính toán ngày từ số ngày gợi ý
        if (taskDetails.suggestedDueDate) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + parseInt(taskDetails.suggestedDueDate));
            taskDetails.dueDate = dueDate.toISOString().split('T')[0];
        }
        return taskDetails;
    }

    // 2. Chia nhỏ task thành subtasks
    async breakdownTask(taskTitle, taskDescription = '') {
        const prompt = `Nhiệm vụ: Chia nhỏ task "${taskTitle}" thành các bước cụ thể.
Trả về JSON:
{
  "analysis": "Phân tích task",
  "subtasks": [{ "title": "Bước cụ thể", "description": "Mô tả", "order": 1 }],
  "totalEstimatedTime": "VD: 4 hours",
  "recommendedApproach": "Gợi ý cách tiếp cận"
}
CHỈ TRẢ VỀ JSON.`;

        return await this.safeGenerate(prompt);
    }

    // 3. Cải thiện mô tả task chuyên nghiệp hơn
    async enhanceDescription(taskTitle, currentDescription = '') {
        const prompt = `Cải thiện mô tả cho task: "${taskTitle}".
Mô tả gốc: "${currentDescription}"
Trả về JSON:
{
  "enhancedDescription": "Mô tả chi tiết chuyên nghiệp",
  "objectives": ["Mục tiêu 1"],
  "keyPoints": ["Lưu ý quan trọng"],
  "successCriteria": ["Tiêu chí hoàn thành"]
}
CHỈ TRẢ VỀ JSON.`;

        return await this.safeGenerate(prompt);
    }

    // 4. Xác định độ ưu tiên dựa trên deadline
    async detectPriority(taskTitle, taskDescription, dueDate = null) {
        const prompt = `Xác định độ ưu tiên cho: "${taskTitle}" (Deadline: ${dueDate || 'N/A'}).
Trả về JSON:
{
  "priority": "low|medium|high|urgent",
  "reasoning": "Lý do chọn mức này",
  "urgencyScore": 0-100
}
CHỈ TRẢ VỀ JSON.`;

        return await this.safeGenerate(prompt);
    }

    // 5. Xử lý hàng loạt (Batch)
    async batchGenerateTasks(descriptions) {
        const tasks = [];
        for (const desc of descriptions) {
            const task = await this.generateTaskDetails(desc);
            tasks.push(task);
            // Gemini 2.0 Free cần nghỉ ít nhất 5s giữa các request trong vòng lặp
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        return tasks;
    }

    // 6. Gợi ý công việc dựa trên ngữ cảnh
    async suggestNextTasks(userContext) {
        const prompt = `Dựa vào dữ liệu: Recent tasks: ${userContext.recentTasks?.join(', ')}.
Gợi ý 3 task tiếp theo người dùng nên làm.
Trả về JSON:
{ "suggestions": [{ "title": "Tên task", "reason": "Tại sao gợi ý", "priority": "medium" }] }
CHỈ TRẢ VỀ JSON.`;

        return await this.safeGenerate(prompt);
    }
}

module.exports = new AIService();   