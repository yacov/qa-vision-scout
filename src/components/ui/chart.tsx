import * as React from "react"
import * as RechartsPrimitive from "recharts"
import type { Payload, ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"
import type { LegendType } from "recharts/types/util/types"

import { cn } from "@/lib/utils"

/**
 * Type System Documentation and Known Issues
 * ----------------------------------------
 * Current challenges with Recharts type integration:
 * 
 * 1. Type Mismatches:
 *    - NameType can be string | number, but our component primarily handles strings
 *    - DataKey can be string | number | function, but we expect string | number
 *    - LegendType has more variants than we currently support
 * 
 * 2. Payload Type Complexity:
 *    - Recharts Payload type is generic and more complex than our usage
 *    - We need to handle both tooltip and legend payload types
 *    - Custom properties like 'color' need to be properly typed
 * 
 * 3. Formatter Function Types:
 *    - Different components expect different formatter signatures
 *    - Need to handle both simple and complex formatting cases
 * 
 * TODO: This needs to be addressed in a separate task (CHART-001):
 * 1. Create proper type hierarchy for chart payloads
 * 2. Implement type guards for all payload variations
 * 3. Add proper generic constraints
 * 4. Create adapter layer for Recharts integration
 * 5. Add comprehensive test suite for type safety
 */

// Base type for chart payloads
type BasePayload = {
  value?: ValueType;
  color?: string;
  name?: NameType;
  dataKey?: string | number;
  payload?: {
    fill?: string;
    [key: string]: any;
  };
};

// Temporary type solution with runtime checks
type ChartPayloadItem = BasePayload & {
  type?: LegendType;
};

// Runtime type guards
const isValidValue = (value: unknown): value is ValueType => {
  return typeof value === 'string' || typeof value === 'number';
};

const isValidName = (name: unknown): name is NameType => {
  return typeof name === 'string' || typeof name === 'number';
};

const isValidDataKey = (key: unknown): key is string | number => {
  return typeof key === 'string' || typeof key === 'number';
};

const isValidColor = (color: unknown): color is string => {
  return typeof color === 'string' && (
    color.startsWith('#') || 
    color.startsWith('rgb') || 
    color.startsWith('hsl')
  );
};

const isValidLegendType = (type: unknown): type is LegendType => {
  return typeof type === 'string' && [
    'plainline',
    'line',
    'square',
    'rect',
    'circle',
    'cross',
    'diamond',
    'star',
    'triangle',
    'wye',
    'none'
  ].includes(type);
};

// Type guard for payload items
function isValidPayloadItem(item: unknown): item is ChartPayloadItem {
  if (!item || typeof item !== 'object') return false;

  const payload = item as Record<string, unknown>;
  
  // Check required properties
  if ('value' in payload && !isValidValue(payload.value)) return false;
  if ('name' in payload && !isValidName(payload.name)) return false;
  if ('dataKey' in payload && !isValidDataKey(payload.dataKey)) return false;
  if ('color' in payload && !isValidColor(payload.color)) return false;
  if ('type' in payload && !isValidLegendType(payload.type)) return false;

  return true;
}

function isValidPayload(
  payload: unknown
): payload is ChartPayloadItem[] {
  return Boolean(
    payload &&
    Array.isArray(payload) &&
    payload.length > 0 &&
    payload.every(isValidPayloadItem)
  );
}

// Adapter function to safely convert payload data
function adaptPayloadItem(item: unknown): ChartPayloadItem | null {
  const payload = item as Payload<ValueType, NameType>;
  
  if (!payload) return null;

  // Handle function dataKey
  const dataKey = typeof payload.dataKey === 'function' 
    ? 'value' 
    : payload.dataKey as string | number | undefined;

  // Validate type
  const type = isValidLegendType(payload.type) ? payload.type : undefined;

  return {
    value: payload.value,
    name: payload.name,
    dataKey,
    color: payload.color,
    payload: payload.payload,
    type
  };
}

type ChartFormatter = (
  value: ValueType,
  name: NameType,
  item: ChartPayloadItem,
  index: number,
  payload?: ChartPayloadItem['payload']
) => React.ReactNode;

function getPayloadConfigFromPayload(
  config: ChartConfig,
  item: ChartPayloadItem,
  key: string
) {
  // Runtime validation
  if (!isValidPayloadItem(item)) {
    console.warn('Invalid payload item:', item);
    return undefined;
  }
  return config[key as keyof typeof config];
}

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item: ChartPayloadItem, index: number) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload?.fill || item.color || ''

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!isValidPayload(payload)) {
      console.warn('Invalid chart payload:', payload);
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {(payload as unknown as ChartPayloadItem[]).map((item) => {
          const adaptedItem = adaptPayloadItem(item);
          if (!adaptedItem) {
            console.warn('Failed to adapt payload item:', item);
            return null;
          }

          const key = `${nameKey || adaptedItem.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, adaptedItem, key)

          return (
            <div
              key={key}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: adaptedItem.color || '',
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
