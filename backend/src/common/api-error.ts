import type { ApiErrorCode, ValidationIssue } from "@qforge/shared";

const definitions = {
  INVALID_INPUT: { status: 400, message: "Dữ liệu gửi lên không hợp lệ." },
  INVALID_JSON: { status: 400, message: "Nội dung yêu cầu phải là JSON hợp lệ." },
  UNAUTHORIZED: { status: 401, message: "Vui lòng đăng nhập để tiếp tục." },
  FORBIDDEN: { status: 403, message: "Bạn không có quyền thực hiện thao tác này." },
  NOT_FOUND: { status: 404, message: "Không tìm thấy dữ liệu." },
  CONFLICT: { status: 409, message: "Thao tác không phù hợp với trạng thái hiện tại." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Nội dung yêu cầu vượt quá dung lượng cho phép." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Kiểu mã hóa của nội dung yêu cầu không được hỗ trợ." },
  DB_UNAVAILABLE: { status: 503, message: "Cơ sở dữ liệu hiện không khả dụng." },
  INTERNAL_ERROR: { status: 500, message: "Đã xảy ra lỗi không mong muốn." },
} satisfies Record<ApiErrorCode, { status: number; message: string }>;

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number;
  readonly details?: ValidationIssue[];

  constructor(code: ApiErrorCode, options: {
    message?: string;
    details?: ValidationIssue[];
  } = {}) {
    super(options.message ?? definitions[code].message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = definitions[code].status;
    this.details = options.details;
  }
}
