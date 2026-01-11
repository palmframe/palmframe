import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LLMModel, LLMModelConfig } from '@/lib/models'
import { getTemplateId, Templates } from '@/lib/templates'
import 'core-js/features/object/group-by.js'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'

export function ChatPicker({
  templates,
  selectedTemplate,
  onSelectedTemplateChange,
}: {
  templates: Templates
  selectedTemplate: string
  onSelectedTemplateChange: (template: string) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col">
        <Select
          name="template"
          defaultValue={selectedTemplate}
          onValueChange={onSelectedTemplateChange}
        >
          <SelectTrigger className="whitespace-nowrap border-none shadow-none focus:ring-0 px-0 py-0 h-6 text-xs">
            <SelectValue placeholder="Select a persona" />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectGroup>
              <SelectLabel>Persona</SelectLabel>
              <SelectItem value="auto">
                <div className="flex items-center space-x-2">
                  <Sparkles
                    className="flex text-[#a1a1aa]"
                    width={14}
                    height={14}
                  />
                  <span>Auto</span>
                </div>
              </SelectItem>
              {Object.entries(templates).map(([templateId, template]) => (
                <SelectItem key={templateId} value={templateId}>
                  <div className="flex items-center space-x-2">
                    <Image
                      className="flex"
                      src={`/thirdparty/templates/${getTemplateId(
                        templateId,
                      )}.svg`}
                      alt={templateId}
                      width={14}
                      height={14}
                    />
                    <span>{template.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
