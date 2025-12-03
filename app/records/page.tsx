"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { userStorage, recordsStorage } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";
import Layout from "@/components/layout/Layout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import type { AccountRecord } from "@/types";
import { Plus, Edit, Trash2, Search } from "lucide-react";

const categories = ["飲食", "交通", "購物", "娛樂", "醫療", "教育", "其他"];

const recordSchema = z.object({
  amount: z.number().min(1, "金額必須大於 0"),
  category: z.string().min(1, "請選擇類別"),
  description: z.string().min(1, "請輸入描述"),
  date: z.string().min(1, "請選擇日期"),
});

type RecordForm = z.infer<typeof recordSchema>;

export default function RecordsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<AccountRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AccountRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    const user = userStorage.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    loadRecords();
  }, [router]);

  const loadRecords = () => {
    const user = userStorage.getCurrentUser();
    if (user) {
      const userRecords = recordsStorage.getAll(user.id);
      setRecords(userRecords);
    }
  };

  const onSubmit = (data: RecordForm) => {
    const user = userStorage.getCurrentUser();
    if (!user) return;

    if (editingRecord) {
      recordsStorage.update(editingRecord.id, {
        ...data,
        date: new Date(data.date),
      });
    } else {
      recordsStorage.create({
        userId: user.id,
        amount: data.amount,
        category: data.category,
        description: data.description,
        source: "web",
        date: new Date(data.date),
      });
    }

    reset();
    setIsModalOpen(false);
    setEditingRecord(null);
    loadRecords();
  };

  const handleEdit = (record: AccountRecord) => {
    setEditingRecord(record);
    reset({
      amount: record.amount,
      category: record.category,
      description: record.description,
      date: new Date(record.date).toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("確定要刪除此記錄嗎？")) {
      recordsStorage.delete(id);
      loadRecords();
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">記帳管理</h1>
            <p className="text-gray-600 mt-1">記錄您的每一筆支出</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            新增記錄
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜尋記錄..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </Card>

        {/* Records List */}
        <Card>
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚無記帳記錄</p>
            ) : (
              filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <p className="font-medium text-gray-900">{record.description}</p>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {record.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(record.date)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="text-lg font-semibold text-red-600">
                      -{formatCurrency(record.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
            reset();
          }}
          title={editingRecord ? "編輯記錄" : "新增記錄"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="金額"
              type="number"
              step="0.01"
              error={errors.amount?.message}
              {...register("amount", { valueAsNumber: true })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                類別
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("category")}
              >
                <option value="">請選擇類別</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>

            <Input
              label="描述"
              type="text"
              placeholder="例如：午餐"
              error={errors.description?.message}
              {...register("description")}
            />

            <Input
              label="日期"
              type="date"
              error={errors.date?.message}
              {...register("date")}
            />

            {/* Natural Language Input (UI only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自然語言輸入（即將推出）
              </label>
              <input
                type="text"
                placeholder="例如：午餐 150 咖哩飯"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                此功能將在連接 LLM API 後啟用
              </p>
            </div>

            {/* Image Upload (UI only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                上傳收據（即將推出）
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500">圖片上傳功能將在連接 Cloudinary 後啟用</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="submit" className="flex-1">
                {editingRecord ? "更新" : "新增"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRecord(null);
                  reset();
                }}
              >
                取消
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}

